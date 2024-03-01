import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { MapArticleViewModelSQL } from './helpers/map-article-view-model'
import { ArticleEntity } from './entities/articles.entity'
import { type ArticleViewModel } from './models/articles.models.sql'
import { type ArticleFilterModel } from './helpers/filter'
import { CacheService } from '../../infrastructure/redis-cache.service'

@Injectable()
export class ArticleQueryRepo {
    constructor(
        private readonly mapArticleViewModel: MapArticleViewModelSQL,
        private readonly cacheService: CacheService,
        @InjectDataSource() protected dataSource: DataSource,
    ) {}

    async findArticleById(id: string): Promise<ArticleViewModel | null> {
        // Проверка, есть ли статья в кэше Redis
        const cacheKey = `article-${id}`
        const cached = await this.cacheService.get(cacheKey)
        if (cached) {
            return JSON.parse(cached)
        }

        const article = await this.dataSource.getRepository(ArticleEntity)
            .createQueryBuilder('a')
            .select(['a.id', 'a.title', 'a.description', 'a.publicationDate', 'a.authorId'])
            .where('a.id = :id', { id })
            .getOne()

        if (article) {
            // Кэширование на 1 час
            await this.cacheService.set(cacheKey, JSON.stringify(article), 3600)
            return this.mapArticleViewModel.getArticleViewModel(article)
        } else {
            return null
        }
    }

    async findAllArticles(queryFilter: ArticleFilterModel) {
        const validSortFields = ['id', 'title', 'description', 'publicationDate', 'authorId']
        if (!validSortFields.includes(queryFilter.sortBy)) {
            throw new Error('Invalid sort field')
        }

        const titleLike =
            queryFilter.searchTitleTerm === null
                ? '%'
                : `%${queryFilter.searchTitleTerm}%`

        const orderByField = `a.${queryFilter.sortBy}`
        const orderByDirection = queryFilter.sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

        const rawArticles = await this.dataSource.getRepository(ArticleEntity)
            .createQueryBuilder('a')
            .select(['a.id', 'a.title', 'a.description', 'a.publicationDate', 'a.authorId'])
            .where('a.title ILIKE :title', { title: titleLike })
            .orderBy(orderByField, orderByDirection)
            .limit(queryFilter.pageSize)
            .offset(queryFilter.pageSize * (queryFilter.pageNumber - 1))
            .getMany()

        const foundArticles = rawArticles.map(article =>
            this.mapArticleViewModel.getArticleViewModel(article),
        )

        const totalArticles = await this.dataSource.getRepository(ArticleEntity)
            .createQueryBuilder('a')
            .select('a.id')
            .where('a.title ILIKE :title', { title: titleLike })
            .getMany()

        const totalCount = totalArticles.length

        return {
            pagesCount: Math.ceil(totalCount / queryFilter.pageSize),
            page: queryFilter.pageNumber,
            pageSize: queryFilter.pageSize,
            totalCount,
            items: foundArticles,
        }
    }
}

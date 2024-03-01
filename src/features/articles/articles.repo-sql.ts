import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'

import { ArticleEntity } from './entities/articles.entity'
import { randomUUID } from 'crypto'
import {
  type ArticleCreateDto,
  type ArticleUpdateInputDto,
} from './models/articles.models.sql'
import { CacheService } from '../../infrastructure/redis-cache.service'

@Injectable()
export class ArticlesRepo {
  constructor(
      @InjectDataSource() protected dataSource: DataSource,
      private readonly cacheService: CacheService
  ) {}

  async createArticle(dto: ArticleCreateDto): Promise<string | null> {
    const id = randomUUID()
    try {
      const article = new ArticleEntity()
      article.id = id
      article.title = dto.title
      article.description = dto.description
      article.publicationDate = dto.publicationDate
      article.authorId = dto.authorId

      await this.dataSource.getRepository(ArticleEntity).save(article)
    } catch (e) {
      console.log(e)
      return null
    }
    return id
  }

  async updateArticle(
    articleId: string,
    updateDTO: ArticleUpdateInputDto,
  ): Promise<boolean> {
    try {
      const article = await this.dataSource
        .getRepository(ArticleEntity)
        .findOneBy({ id: articleId })
      if (article) {
        article.title = updateDTO.title
        article.description = updateDTO.description
        await this.dataSource.getRepository(ArticleEntity).save(article)

        // Инвалидация кеша Redis
        await this.cacheService.del(`article-${articleId}`)
      }
    } catch (e) {
      console.log(e)
      return false
    }
    return true
  }

  async deleteArticle(articleId: string): Promise<boolean> {
    try {
      await this.dataSource
        .getRepository(ArticleEntity)
        .createQueryBuilder()
        .delete()
        .from(ArticleEntity)
        .where('id = :id', { id: articleId })
        .execute()

      // Инвалидация кеша Redis
      await this.cacheService.del(`article-${articleId}`)
    } catch (e) {
      console.log(e)
      return false
    }
    return true
  }

  async findArticleById(id: string): Promise<ArticleEntity | null | false> {
    try {
      const article = await this.dataSource
        .getRepository(ArticleEntity)
        .createQueryBuilder('a')
        .select([
          'a.id',
          'a.title',
          'a.description',
          'a.publicationDate',
          'a.authorId',
        ])
        .where('a.id = :id', { id })
        .getOne()
      return article
    } catch (e) {
      console.log(e)
      return false
    }
  }
}

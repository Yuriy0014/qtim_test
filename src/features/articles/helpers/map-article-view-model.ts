import { Injectable } from '@nestjs/common'
import { type ArticleEntity } from '../entities/articles.entity'
import { type ArticleViewModel } from '../models/articles.models.sql'

@Injectable()
export class MapArticleViewModelSQL {
    getArticleViewModel = (article: ArticleEntity): ArticleViewModel => {
        return {
            id: article.id,
            title: article.title,
            description: article.description,
            publicationDate: article.publicationDate.toISOString(),
            authorId: article.authorId,
        }
    }
}

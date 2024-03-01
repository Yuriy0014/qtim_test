import { type CanActivate, type ExecutionContext, Injectable, NotFoundException } from '@nestjs/common'
import { type Observable } from 'rxjs'
import { ArticleQueryRepo } from '../articles.query-repo-sql'

@Injectable()
export class ArticleExistsGuard implements CanActivate {
    constructor(private readonly articlesQueryRepo: ArticleQueryRepo) {}

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest()
        const articleId = request.params.id

        return this.checkArticleExists(articleId)
    }

    private async checkArticleExists(articleId: string): Promise<boolean> {
        const article = await this.articlesQueryRepo.findArticleById(articleId)
        if (!article) {
            throw new NotFoundException(`Статья с ID ${articleId} не найдена.`)
        }
        return true
    }
}

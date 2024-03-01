import { type CanActivate, type ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common'
import { ArticleQueryRepo } from '../articles.query-repo-sql'

@Injectable()
export class IsArticleOwnerGuard implements CanActivate {
    constructor(private readonly articleQueryRepo: ArticleQueryRepo) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const userId = request.user.userId
        const articleId = request.params.id

        const article = await this.articleQueryRepo.findArticleById(articleId)
        if (!article) {
            return false
        }

        if (article.authorId !== userId) {
            throw new ForbiddenException('Вы не являетесь владельцем этой статьи.')
        }

        return true
    }
}

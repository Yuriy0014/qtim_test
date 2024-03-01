import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs'
import { HttpStatus } from '@nestjs/common'
import { type Result } from '../../../helpers/result-types'
import { type ArticleUpdateInputDto, type ArticleViewModel } from '../models/articles.models.sql'
import { MapArticleViewModelSQL } from '../helpers/map-article-view-model'
import { ArticlesRepo } from '../articles.repo-sql'

export class UpdateArticleCommand {
    constructor(
        public articleId: string,
        public articleUpdateModelDTO: ArticleUpdateInputDto
    ) {}
}

@CommandHandler(UpdateArticleCommand)
export class UpdateArticleUseCase implements ICommandHandler<UpdateArticleCommand> {
    constructor(
        private readonly articlesRepo: ArticlesRepo,
        private readonly mapArticleViewModel: MapArticleViewModelSQL,
    ) {}

    async execute(command: UpdateArticleCommand): Promise<Result<ArticleViewModel>> {
        const updateResult = await this.articlesRepo.updateArticle(command.articleId, command.articleUpdateModelDTO)
        if (!updateResult) {
            return {
                resultCode: HttpStatus.INTERNAL_SERVER_ERROR,
                data: null,
                errorMessage: 'Возникла ошибка при обновлении статьи',
            }
        }

        const updatedArticle = await this.articlesRepo.findArticleById(command.articleId)
        if (!updatedArticle) {
            return {
                resultCode: HttpStatus.INTERNAL_SERVER_ERROR,
                data: null,
                errorMessage: 'Возникла ошибка при получении обновленной статьи',
            }
        }

        return {
            resultCode: HttpStatus.OK,
            data: this.mapArticleViewModel.getArticleViewModel(updatedArticle),
        }
    }
}

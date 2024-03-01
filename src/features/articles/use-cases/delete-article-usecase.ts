import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs'
import { ArticlesRepo } from '../articles.repo-sql'
import { type Result } from '../../../helpers/result-types'
import { HttpStatus } from '@nestjs/common'

export class DeleteArticleCommand {
  constructor(public articleId: string) {}
}

@CommandHandler(DeleteArticleCommand)
export class DeleteArticleUseCase
  implements ICommandHandler<DeleteArticleCommand>
{
  constructor(private readonly articlesRepo: ArticlesRepo) {}

  async execute(command: DeleteArticleCommand): Promise<Result<boolean>> {
    const deleteResult = await this.articlesRepo.deleteArticle(
      command.articleId,
    )

    if (!deleteResult) {
      return {
        resultCode: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
        errorMessage: 'Возникла ошибка при удалении статьи',
      }
    }

    return {
      resultCode: HttpStatus.NO_CONTENT,
      data: true
    }
  }
}

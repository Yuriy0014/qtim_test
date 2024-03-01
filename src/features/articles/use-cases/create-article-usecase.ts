import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs'
import { HttpStatus } from '@nestjs/common'
import { type Result } from '../../../helpers/result-types'
import {
  type ArticleCreateDto,
  type ArticleInputDTO,
  type ArticleViewModel,
} from '../models/articles.models.sql'
import { MapArticleViewModelSQL } from '../helpers/map-article-view-model'
import { ArticlesRepo } from '../articles.repo-sql'

export class CreateArticleCommand {
  constructor(
    public articleCreateModelDTO: ArticleInputDTO,
    public userId: string,
  ) {}
}

@CommandHandler(CreateArticleCommand)
export class CreateArticleUseCase
  implements ICommandHandler<CreateArticleCommand>
{
  constructor(
    private readonly articlesRepo: ArticlesRepo,
    private readonly mapArticleViewModel: MapArticleViewModelSQL,
  ) {}

  async execute(
    command: CreateArticleCommand,
  ): Promise<Result<ArticleViewModel>> {
    const createDTO: ArticleCreateDto = {
      ...command.articleCreateModelDTO,
      publicationDate: new Date(),
      authorId: command.userId,
    }

    const articleId = await this.articlesRepo.createArticle(createDTO)
    if (!articleId) {
      return {
        resultCode: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
        errorMessage: 'Возникла ошибка при создании статьи',
      }
    }
    const createdArticle = await this.articlesRepo.findArticleById(articleId)
    if (!createdArticle) {
      return {
        resultCode: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
        errorMessage: 'Возникла ошибка при получении созданной статьи',
      }
    }
    return {
      resultCode: HttpStatus.OK,
      data: this.mapArticleViewModel.getArticleViewModel(createdArticle),
    }
  }
}

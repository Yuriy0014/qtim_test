import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { queryArticlePagination } from './helpers/filter'
import { ArticleQueryRepo } from './articles.query-repo-sql'
import {
  ArticleInputDTO,
  ArticleUpdateInputDto,
  type ArticleViewModel,
  type ArticleWithPaginationDto,
} from './models/articles.models.sql'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CreateArticleCommand } from './use-cases/create-article-usecase'
import { UpdateArticleCommand } from './use-cases/update-article-usecase'
import { type Result } from '../../helpers/result-types'
import { DeleteArticleCommand } from './use-cases/delete-article-usecase'
import { ArticleExistsGuard } from './guards/exist-article.guard'
import { IsArticleOwnerGuard } from './guards/is-owner.guard'
import { CustomRequest } from '../auth/models/req.model'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'

@ApiTags('articles')
@Controller('articles')
export class ArticlesController {
  constructor(
    private readonly articleQueryRepo: ArticleQueryRepo,
    private readonly commandBus: CommandBus,
  ) {}

  @ApiOperation({ summary: 'Get all articles' })
  @Get()
  async findAllArticles(
    @Query()
    query: {
      searchTitleTerm?: string
      sortBy?: string
      sortDirection?: string
      pageNumber?: string
      pageSize?: string
    },
  ): Promise<ArticleWithPaginationDto> {
    const queryFilter = queryArticlePagination(query)
    const foundArticles: ArticleWithPaginationDto =
      await this.articleQueryRepo.findAllArticles(queryFilter)

    if (!foundArticles.items.length) {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND)
    }
    return foundArticles
  }

  @ApiOperation({ summary: 'Get te article by id' })
  @Get(':id')
  async getArticleById(@Param('id') id: string): Promise<ArticleViewModel> {
    const article = await this.articleQueryRepo.findArticleById(id)
    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`)
    }
    return article
  }

  @ApiOperation({ summary: 'Create new article' })
  @ApiBearerAuth()
  @Post()
  @UseGuards(JwtAuthGuard)
  async createArticle(
    @Body() articleDto: ArticleInputDTO,
    @Req() req: CustomRequest,
  ): Promise<ArticleViewModel> {
    const createdArticle: Result<ArticleViewModel> =
      await this.commandBus.execute(
        new CreateArticleCommand(articleDto, req.user.userId),
      )

    if (createdArticle.data === null) {
      throw new HttpException(
        createdArticle.errorMessage ?? 'Возникла ошибка при создании статьи',
        createdArticle.resultCode,
      )
    }
    return createdArticle.data
  }

  @ApiOperation({ summary: 'Update the article' })
  @ApiBearerAuth()
  @Put(':id')
  @UseGuards(JwtAuthGuard, ArticleExistsGuard, IsArticleOwnerGuard)
  async updateArticle(
    @Param('id') id: string,
    @Body() articleDto: ArticleUpdateInputDto,
  ): Promise<void> {
    const updateResult = await this.commandBus.execute(
      new UpdateArticleCommand(id, articleDto),
    )

    if (updateResult.data === null) {
      throw new HttpException(
        updateResult.errorMessage ?? 'Возникла ошибка при обновлении статьи',
        updateResult.resultCode,
      )
    }
    return updateResult.data
  }

  @ApiOperation({ summary: 'Delete the article' })
  @ApiBearerAuth()
  @Delete(':id')
  @UseGuards(JwtAuthGuard, ArticleExistsGuard, IsArticleOwnerGuard)
  @HttpCode(204)
  async deleteArticle(@Param('id') id: string): Promise<void> {
    const deleteResult = await this.commandBus.execute(
      new DeleteArticleCommand(id),
    )

    if (deleteResult.data === null) {
      throw new HttpException(
        deleteResult.errorMessage ?? 'Возникла ошибка при удалении статьи',
        deleteResult.resultCode,
      )
    }
  }
}

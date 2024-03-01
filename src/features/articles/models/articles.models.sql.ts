import { IsString, Matches, MaxLength, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ArticleInputDTO {
  @ApiProperty({
    example: 'Example title',
    description: 'Title of the article',
    minLength: 5,
    maxLength: 30,
  })
  @IsString()
  @MinLength(5)
  @MaxLength(30)
  @Matches(/^\S.*\S$|^\S+$/, {
    message: 'Title не должен состоять только из пробелов',
  })
  title: string

  @ApiProperty({
    example: 'Example article description',
    description: 'Description of the article',
    minLength: 10,
    maxLength: 300,
  })
  @IsString()
  @Matches(/^\S.*\S$|^\S+$/, {
    message: 'Description не должен состоять только из пробелов',
  })
  @MinLength(10)
  @MaxLength(300)
  description: string
}

export class ArticleUpdateInputDto {
  @IsString()
  @MinLength(5)
  @MaxLength(30)
  @Matches(/^\S.*\S$|^\S+$/, {
    message: 'Title не должен состоять только из пробелов',
  })
  title: string

  @IsString()
  @Matches(/^\S.*\S$|^\S+$/, {
    message: 'Description не должен состоять только из пробелов',
  })
  @MinLength(10)
  @MaxLength(300)
  description: string
}

export class ArticleViewModel {
  id: string
  title: string
  description: string
  publicationDate: string
  authorId: string
}

export interface ArticleWithPaginationDto {
  items: ArticleViewModel[]
  page: number // Текущая страница
  pageSize: number // Количество статей на странице
  totalCount: number // Общее количество статей, соответствующих запросу
}

export class ArticleCreateDto {
  title: string
  description: string
  publicationDate: Date
  authorId: string
}

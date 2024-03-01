import { Test } from '@nestjs/testing'
import { CreateArticleUseCase } from '../../src/features/articles/use-cases/create-article-usecase'
import { ArticlesRepo } from '../../src/features/articles/articles.repo-sql'
import { type ArticleCreateDto } from '../../src/features/articles/models/articles.models.sql'
import { MapArticleViewModelSQL } from '../../src/features/articles/helpers/map-article-view-model'

describe('CreateArticleUseCase Unit Test', () => {
    let articlesRepo: ArticlesRepo
    let createArticleUseCase: CreateArticleUseCase

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [
                CreateArticleUseCase,
                MapArticleViewModelSQL,
                {
                    provide: ArticlesRepo,
                    useValue: {
                        createArticle: jest.fn().mockResolvedValue(
                            '123'
                        ),
                        findArticleById: jest.fn().mockImplementation(async (id: string) => {
                            if (id === '123') {
                                return {
                                    id: '123',
                                    title: 'Test Article',
                                    description: 'Test Content',
                                    publicationDate: new Date(),
                                    authorId: '1',
                                }
                            }
                            return null
                        }),
                    },
                },
            ],
        }).compile()

        articlesRepo = moduleRef.get<ArticlesRepo>(ArticlesRepo)
        createArticleUseCase = moduleRef.get<CreateArticleUseCase>(CreateArticleUseCase)
    })

    it('should create an article successfully', async () => {
        const articleDto: ArticleCreateDto = {
            title: 'Test Article',
            description: 'Test Content',
            publicationDate: new Date(),
            authorId: '1',
        }

        const result = await createArticleUseCase.execute({
            articleCreateModelDTO: articleDto,
            userId: articleDto.authorId,
        })

        expect(result).toHaveProperty('data')
        expect(result.data).not.toBeNull()
        if (result.data) {
            expect(result.data.title).toEqual(articleDto.title)
        }

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(articlesRepo.createArticle).toHaveBeenCalledWith(expect.anything())
    })
})

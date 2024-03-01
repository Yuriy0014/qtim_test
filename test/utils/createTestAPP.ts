import { Test } from '@nestjs/testing'
import { AppModule } from '../../src/app.module'
import {
    BadRequestException,
    type INestApplication,
    ValidationPipe,
} from '@nestjs/common'
import cookieParser from 'cookie-parser'
import {
    ErrorExceptionFilter,
    HttpExceptionFilter,
} from '../../src/middlewares/exception.filter'

export const createTestAPP = async () => {
    let app: INestApplication

    const moduleFixture = await Test.createTestingModule({
        imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.use(cookieParser())
    app.useGlobalPipes(
        new ValidationPipe({
            // Автоматически преобразует входящие данные по типам. Например id из params делает из строки
            // числом, если указано @Params('id') userId: number
            transform: true,
            stopAtFirstError: true,
            exceptionFactory: (errors) => {
                const errorsForResponse = []

                errors.forEach((e) => {
                    const constrKeys = Object.keys(e.constraints!)
                    constrKeys.forEach((ckey) => {
                        // @ts-expect-error
                        errorsForResponse.push({
                            message: e.constraints![ckey],
                            field: e.property,
                        })
                    })
                })

                throw new BadRequestException(errorsForResponse)
            },
        }),
    )
    app.useGlobalFilters(new ErrorExceptionFilter(), new HttpExceptionFilter())
    await app.init() // как await app.listen(port);

    return app
}

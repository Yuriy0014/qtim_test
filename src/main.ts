import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import cookieParser from 'cookie-parser'
import process from 'process'
import { BadRequestException, ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import {
  ErrorExceptionFilter,
  HttpExceptionFilter,
} from './middlewares/exception.filter'

const port = process.env.PORT ?? 7200

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors()
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

    const config = new DocumentBuilder()
        .setTitle('QTIM Company Test Task')
        .setDescription('The articles API description')
        .setVersion('1.0')
        .addTag('auth')
        .addTag('articles')
        .addBasicAuth()
        .addBearerAuth()
        .build()
    const document = SwaggerModule.createDocument(app, config)

  SwaggerModule.setup('api', app, document)

  await app.listen(port)
}

void bootstrap()

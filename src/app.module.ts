import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ConfigModule } from '@nestjs/config'
import * as process from 'process'
import { AuthController } from './features/auth/auth.controller'
import { PassportModule } from '@nestjs/passport'
import { JwtStrategy } from './features/auth/strategies/jwt.strategy'
import { LocalStrategy } from './features/auth/strategies/local.strategy'
import { CreateUserUseCase } from './features/users/use-cases/CreateUserUseCase'
import { CheckCredentialsUseCase } from './features/auth/use-cases/CheckCredentialsUseCase'
import { RegisterSessionUseCase } from './features/auth/use-cases/RegisterSessionUseCase'
import { CqrsModule } from '@nestjs/cqrs'
import { DeleteSessionUseCase } from './features/auth/use-cases/DeleteSessionUseCase'
import { ThrottlerModule } from '@nestjs/throttler'
import { UpdateSessionUseCase } from './features/auth/use-cases/UpdateSessionUseCase'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MapUserViewModelSQL } from './features/users/helpers/map-UserViewModel-sql'
import { UsersQueryRepoSQL } from './features/users/users.query-repo-sql'
import { UsersRepo } from './features/users/users-repo.service'
import { SessionsRepoSQL } from './features/auth/sessions.repo-sql'
import { SessionsQueryRepoSQL } from './features/auth/sessions.query.repo-sql'
import { MapSessionViewModelSQL } from './features/auth/helpers/map-SessionViewModel-SQL'
import { join } from 'path'
import { JwtService } from './features/auth/jwt.service'
import { CreateArticleUseCase } from './features/articles/use-cases/create-article-usecase'
import { DeleteArticleUseCase } from './features/articles/use-cases/delete-article-usecase'
import { UpdateArticleUseCase } from './features/articles/use-cases/update-article-usecase'
import { ArticlesController } from './features/articles/articles.controller'
import { ArticlesRepo } from './features/articles/articles.repo-sql'
import { ArticleQueryRepo } from './features/articles/articles.query-repo-sql'
import { MapArticleViewModelSQL } from './features/articles/helpers/map-article-view-model'
import { TestingController } from './features/testing/testing.controller'
import { CacheService } from './infrastructure/redis-cache.service'
import { UserEntity } from './features/users/entities/user.entity'
import { SessionEntity } from './features/auth/entities/sessions.entity'
import { ArticleEntity } from './features/articles/entities/articles.entity'

const useCases = [
  // Users
  CreateUserUseCase,
  // Auth
  CheckCredentialsUseCase,
  RegisterSessionUseCase,
  DeleteSessionUseCase,
  UpdateSessionUseCase,
  // Articles
  CreateArticleUseCase,
  DeleteArticleUseCase,
  UpdateArticleUseCase
]

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 10,
        limit: 5,
      },
    ]),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: process.env.PG_NAME,
      password: process.env.PG_PASS,
      database: 'qtim_test',
      autoLoadEntities: true,
      synchronize: false,
      logging: true,
      entities: [join(__dirname, '**', '*.entity.{ts,js}')]
    }),
      TypeOrmModule.forFeature([UserEntity, SessionEntity, ArticleEntity]),
    PassportModule,
    CqrsModule,
  ],
  controllers: [
    AppController,
    AuthController,
    ArticlesController,
    TestingController
  ],
  providers: [
    AppService,
    // Users
    UsersQueryRepoSQL,
    UsersRepo,
    MapUserViewModelSQL,
    // JWT
    JwtService,
    SessionsRepoSQL,
    SessionsQueryRepoSQL,
    JwtStrategy,
    LocalStrategy,
    MapSessionViewModelSQL,
    /// Articles
    ArticlesRepo,
    ArticleQueryRepo,
    MapArticleViewModelSQL,
    /// Redis
    CacheService,
    /// UseCases
    ...useCases,
  ],
})
export class AppModule {
}

import {
  BadRequestException,
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import jwt, { TokenExpiredError } from 'jsonwebtoken'
import { UsersQueryRepoSQL } from '../../users/users.query-repo-sql'
import { SessionsQueryRepoSQL } from '../sessions.query.repo-sql'

@Injectable()
export class ExistingEmailGuard implements CanActivate {
    constructor(protected usersQueryRepo: UsersQueryRepoSQL) {
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest()

        const loginExists = await this.usersQueryRepo.findByLoginOrEmail(
            req.body.login,
        )
        const emailExists = await this.usersQueryRepo.findByLoginOrEmail(
            req.body.email,
        )

        if (loginExists) {
            throw new BadRequestException([
                { message: 'BAD REQUEST', field: 'login' },
            ])
        }

        if (emailExists) {
            throw new BadRequestException([
                { message: 'BAD REQUEST', field: 'email' },
            ])
        }
        return true
    }
}

@Injectable()
export class VerifyRefreshTokenGuard implements CanActivate {
    constructor(protected sessionsQueryRepo: SessionsQueryRepoSQL) {
    }

    private catchTokenError(err: any) {
        if (err instanceof TokenExpiredError) {
            throw new UnauthorizedException([
                { message: 'Unauthorized! Token has expired!', field: 'refreshToken' },
            ])
        }

        throw new UnauthorizedException([
            { message: 'Unauthorized!', field: 'refreshToken' },
        ])
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest()
        const refreshTokenCookie = req.cookies.refreshToken

        if (!refreshTokenCookie) {
            throw new UnauthorizedException([
                { message: 'UnauthorizedException', field: 'refreshToken' },
            ])
        }
        try {
            const result: any = jwt.verify(
                refreshTokenCookie,
                process.env.JWT_SECRET!,
            )

            // Проверяем наличие RFToken в базе активных сессий
            const deviceId: string = result.deviceId
            const RFTIAT = result.iat * 1000
            const isActive = await this.sessionsQueryRepo.findSessionWithRFToken(
                RFTIAT,
                deviceId,
            )
            if (!isActive) {
                throw new UnauthorizedException([
                    {
                        message: 'Unauthorized! В БД с сессиями нет такой записи',
                        field: 'refreshToken',
                    },
                ])
            }

            req.userId = result.userId
            return true
        } catch (e) {
            console.log(e)
            this.catchTokenError(e)
            return false
        }
    }
}

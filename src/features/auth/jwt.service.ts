import { Injectable } from '@nestjs/common'
import jwt from 'jsonwebtoken'
import { ConfigService } from '@nestjs/config'
import { type UserViewModel } from '../users/models/users.models.sql'

@Injectable()
export class JwtService {
    private readonly JWT_SECRET: string

    constructor(private readonly configService: ConfigService) {
        this.JWT_SECRET = configService.getOrThrow('JWT_SECRET')
    }

    async createJWT(user: UserViewModel) {
        return jwt.sign({ userId: user.id }, this.JWT_SECRET, {
            expiresIn: '2000s',
        })
    }

    async createJWTRefresh(
        user: UserViewModel,
        deviceId: string,
    ): Promise<string> {
        return jwt.sign({ userId: user.id, deviceId }, this.JWT_SECRET, {
            expiresIn: '4000s',
        })
    }

    async getInfoFromRFToken(refreshToken: string) {
        try {
            const result: any = jwt.verify(refreshToken, this.JWT_SECRET)
            return {
                deviceId: result.deviceId,
                iat: result.iat * 1000,
                userId: result.userId,
            }
        } catch (e) {
            return null
        }
    }
}

import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common'
import { JwtService } from '../jwt.service'

@Injectable()
export class CheckUserIdGuard implements CanActivate {
    constructor(protected jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest()
        const authHeader = req.headers.authorization
        if (!authHeader) {
            return true
        }

        const token = authHeader.split(' ')[1]

        const RFTokenInfo = await this.jwtService.getInfoFromRFToken(token)
        if (RFTokenInfo) {
            req.userId = RFTokenInfo.userId
            return true
        }
        return true
    }
}

import { Injectable } from '@nestjs/common'
import { type UserEntity } from '../entities/user.entity'
import { type UserViewModel } from '../models/users.models.sql'

@Injectable()
export class MapUserViewModelSQL {
    getUserViewModel(user: UserEntity): UserViewModel {
        return {
            id: user.id,
            login: user.login,
            email: user.email,
            createdAt: user.createdAt.toISOString(),
        }
    }
}

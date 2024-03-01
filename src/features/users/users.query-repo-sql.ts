import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { MapUserViewModelSQL } from './helpers/map-UserViewModel-sql'
import { type UserViewModel } from './models/users.models.sql'
import { UserEntity } from './entities/user.entity'

@Injectable()
export class UsersQueryRepoSQL {
    constructor(
        private readonly mapUserViewModelSQL: MapUserViewModelSQL,
        @InjectDataSource() protected dataSource: DataSource
    ) {
    }

    async findByLoginOrEmail(
        loginOrEmail: string,
    ): Promise<UserViewModel | null> {
        const user = await this.dataSource
            .getRepository(UserEntity)
            .createQueryBuilder('u')
            .select([
                'u.id',
                'u.login',
                'u.email',
                'u.password',
                'u.createdAt'
            ])
            .where('u.login = :loginOrEmail OR u.email = :loginOrEmail', { loginOrEmail })
            .getOne()

        if (user) {
            return this.mapUserViewModelSQL.getUserViewModel(user)
        }
        return null
    }

    async findUserById(id: string) {
        try {
            const user = await this.dataSource
                .getRepository(UserEntity)
                .createQueryBuilder('u')
                .select([
                    'u.id',
                    'u.login',
                    'u.email',
                    'u.password',
                    'u.createdAt'
                ])
                .where('u.id = :id', { id })
                .getOne()
            if (user) {
                return this.mapUserViewModelSQL.getUserViewModel(user)
            } else {
                return null
            }
        } catch (e) {
            console.log(e)
            return null
        }
    }
}

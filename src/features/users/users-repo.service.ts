import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { UserEntity } from './entities/user.entity'
import { type UserCreateModel } from './models/users.models.sql'
import { randomUUID } from 'crypto'

@Injectable()
export class UsersRepo {
    constructor(
        @InjectDataSource() protected dataSource: DataSource,
    ) {
    }

    async createUser(createDTO: UserCreateModel): Promise<string> {
        const id = randomUUID()

        const user = new UserEntity()
        user.id = id
        user.login = createDTO.login
        user.email = createDTO.email
        user.password = createDTO.passwordHash
        user.createdAt = new Date()

        await this.dataSource.getRepository(UserEntity).save(user)

        return id
    }

    async findUserById(UserId: string): Promise<UserEntity | null> {
        const foundUser = await this.dataSource.getRepository(UserEntity)
            .createQueryBuilder('u')
            .select(['u.id',
                'u.login',
                'u.email',
                'u.password',
                'u.createdAt'])
            .where('u.id = :UserId', { UserId })
            .getOne()

        if (foundUser) {
            return foundUser
        } else {
            return null
        }
    }

    async findByLoginOrEmail(loginOrEmail: string): Promise<UserEntity | null> {
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

        return user
    }
}

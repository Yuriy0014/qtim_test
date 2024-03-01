import { type UserCreateModel, type UserInputModel } from '../models/users.models.sql'
import bcrypt from 'bcrypt'
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs'
import { UsersRepo } from '../users-repo.service'

enum ResultCode {
    success,
    internalServerError,
    badRequest,
    incorrectEmail,
}

interface Result<T> {
    resultCode: ResultCode
    data: T | null
    errorMessage?: string
}

export class CreateUserCommand {
    constructor(
        public inputModel: UserInputModel,
        public isAuthorSuper: boolean,
    ) {
    }
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase implements ICommandHandler<CreateUserCommand> {
    constructor(
        private readonly usersRepo: UsersRepo,
    ) {
    }

    async execute(command: CreateUserCommand): Promise<Result<string>> {
        const passwordHash = await bcrypt.hash(command.inputModel.password, 10) // Соль генерируется автоматически за 10 кругов - второй параметр
        const createDTO: UserCreateModel = {
            ...command.inputModel,
            passwordHash,
            isAuthorSuper: command.isAuthorSuper,
        }

        // Создаем юзера
        const userId = await this.usersRepo.createUser(createDTO)

        // Селектим созданного
        const createdUser = await this.usersRepo.findUserById(userId)
        if (!createdUser) {
            throw new Error('Проблема с созданием польователя')
        }
        return {
            resultCode: ResultCode.success,
            data: createdUser.id,
        }
    }
}

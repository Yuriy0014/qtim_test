import { type reqSessionDTOType } from '../models/auth.models-sql'
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs'
import { SessionsRepoSQL } from '../sessions.repo-sql'

export class RegisterSessionCommand {
    constructor(public sessionDTO: reqSessionDTOType) {}
}

@CommandHandler(RegisterSessionCommand)
export class RegisterSessionUseCase
implements ICommandHandler<RegisterSessionCommand>
{
    constructor(private readonly sessionRepo: SessionsRepoSQL) {}

    async execute(command: RegisterSessionCommand): Promise<boolean> {
        try {
            await this.sessionRepo.createSessionInfo(command.sessionDTO)
            return true
        } catch (e) {
            return false
        }
    }
}

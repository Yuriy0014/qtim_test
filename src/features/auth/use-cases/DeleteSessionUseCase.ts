import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs'
import { SessionsRepoSQL } from '../sessions.repo-sql'

export class DeleteSessionCommand {
    constructor(public currentRFTokenIAT: number, public userId: string) {}
}

@CommandHandler(DeleteSessionCommand)
export class DeleteSessionUseCase
implements ICommandHandler<DeleteSessionCommand>
{
    constructor(private readonly sessionRepo: SessionsRepoSQL) {}

    async execute(command: DeleteSessionCommand): Promise<boolean> {
        return this.sessionRepo.deleteSessionInfo(
            command.currentRFTokenIAT,
            command.userId,
        )
    }
}

import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs'
import add from 'date-fns/add'
import { type SessionUpdateFilterModel } from '../models/auth.models-sql'
import { SessionsRepoSQL } from '../sessions.repo-sql'

export class UpdateSessionCommand {
    constructor(
        public currentRFTokenIAT: number,
        public deviceId: string,
        public loginIp: string,
        public RefreshTokenIssuedAt: number,
        public deviceName: string,
        public UserId: string,
    ) {
    }
}

@CommandHandler(UpdateSessionCommand)
export class UpdateSessionUseCase
implements ICommandHandler<UpdateSessionCommand> {
    constructor(private readonly sessionsRepo: SessionsRepoSQL) {
    }

    async execute(command: UpdateSessionCommand): Promise<boolean> {
        const filter: SessionUpdateFilterModel = {
            deviceId: command.deviceId,
            RFTokenIAT: new Date(command.currentRFTokenIAT),
            userId: command.UserId,
        }

        const updateSessionContent = {
            ip: command.loginIp,
            lastActiveDate: new Date(),
            deviceName: command.deviceName,
            RFTokenIAT: new Date(command.RefreshTokenIssuedAt),
            RFTokenObsoleteDate: add(new Date(command.RefreshTokenIssuedAt), {
                seconds: 2000,
            }),
        }

        return this.sessionsRepo.updateSessionInfo(filter, updateSessionContent)
    }
}

import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { MapSessionViewModelSQL } from './helpers/map-SessionViewModel-SQL'
import { SessionEntity } from './entities/sessions.entity'

@Injectable()
export class SessionsQueryRepoSQL {
    constructor(
        @InjectDataSource() protected dataSource: DataSource,
        private readonly mapSessionViewModel: MapSessionViewModelSQL,
    ) {
    }

    async findSessionWithRFToken(RFTIAT: number, deviceId: string) {
        const foundSession = await this.dataSource.getRepository(SessionEntity)
            .createQueryBuilder('s')
            .select([
                's.id',
                's.ip',
                's.title',
                's.lastActiveDate',
                's.deviceId',
                's.deviceName',
                's.userId',
                's.RFTokenIAT',
                's.RFTokenObsoleteDate'
            ])
            .where('s.deviceId = :deviceId AND s.RFTokenIAT = :IAt ', { deviceId, IAt: new Date(RFTIAT) })
            .getOne()

        if (foundSession) {
            return this.mapSessionViewModel.getSessionViewModel(foundSession)
        } else {
            return null
        }
    }
}

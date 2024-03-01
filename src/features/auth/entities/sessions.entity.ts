import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm'
import { UserEntity } from '../../users/entities/user.entity'

@Entity({ name: 'sessions' })
export class SessionEntity {
    @PrimaryGeneratedColumn('uuid')
        id: string

    @Column()
        ip: string

    @Column()
        title: string

    @Column()
        lastActiveDate: Date

    @Column()
        deviceId: string

    @Column()
        deviceName: string

    @Column()
        userId: string

    @Column()
        RFTokenIAT: Date

    @Column()
        RFTokenObsoleteDate: Date

    @ManyToOne(() => UserEntity, (user) => user.sessions)
        user: UserEntity
}

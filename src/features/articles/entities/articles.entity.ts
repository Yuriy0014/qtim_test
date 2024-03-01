import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { UserEntity } from '../../users/entities/user.entity'

@Entity({ name: 'articles' })
export class ArticleEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    title: string

    @Column()
    description: string

    @Column({ type: 'timestamp with time zone' })
    publicationDate: Date

    @ManyToOne(() => UserEntity, (user) => user.articles)
    @JoinColumn({ name: 'authorId' })
    author: UserEntity

    @Column()
    authorId: string
}

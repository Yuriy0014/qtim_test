import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { SessionEntity } from '../../auth/entities/sessions.entity'
import { ArticleEntity } from '../../articles/entities/articles.entity'

@Entity({ name: 'users' })
export class UserEntity {
    @PrimaryGeneratedColumn('uuid')
        id: string

    @Column()
        login: string

    @Column()
        email: string

    @Column()
        password: string

    @Column()
        createdAt: Date

    @OneToMany(() => SessionEntity, (session) => session.user)
        sessions: SessionEntity[]

    @OneToMany(() => ArticleEntity, (article) => article.author)
    articles: ArticleEntity[]
}

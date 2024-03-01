import { Injectable } from '@nestjs/common'
import Redis from 'ioredis'

@Injectable()
export class CacheService {
    private readonly redisClient: Redis

    constructor() {
        this.redisClient = new Redis({
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT),
        })
    }

    async get(key: string): Promise<string | null> {
        return await this.redisClient.get(key)
    }

    async set(key: string, value: string, ttl: number): Promise<void> {
        await this.redisClient.set(key, value, 'EX', ttl)
    }

    async del(key: string): Promise<void> {
        await this.redisClient.del(key)
    }
}

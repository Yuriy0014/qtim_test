import { type HttpStatus } from '@nestjs/common'

export interface Result<T> {
    resultCode: HttpStatus
    data: T | null
    errorMessage?: string
}

import { ApiProperty } from '@nestjs/swagger'

export class ErrorMessage {
    @ApiProperty({ example: 'Wrong email', description: 'Error description' })
    message: string

    @ApiProperty({ example: 'email', description: 'Field where the error occurred' })
    field: string
}

export class ApiBadRequestResponse {
    @ApiProperty({
        type: [ErrorMessage],
        description: 'Array of error messages'
    })
    errorsMessages: ErrorMessage[]
}

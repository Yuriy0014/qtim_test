import {
    IsEmail,
    IsNotEmpty,
    IsString,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export interface UserViewModel {
    id: string
    login: string
    email: string
    createdAt: string
}

export interface UserCreateModel {
    login: string
    passwordHash: any
    email: string
    isAuthorSuper: boolean
}

export class UserInputModel {
    @ApiProperty({
        example: 'YURL',
        description: 'Login',
        minLength: 5,
        maxLength: 30,
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(3)
    @MaxLength(10)
    @Matches(/^[a-zA-Z0-9_-]*$/)
        login: string

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    @MaxLength(20)
    @Matches(/.*\S+.*/, {
        message: 'Title should not consist of whitespace characters',
    })
        password: string

    @IsNotEmpty()
    @IsString()
    @MinLength(5)
    @MaxLength(50)
    @IsEmail()
        email: string
}

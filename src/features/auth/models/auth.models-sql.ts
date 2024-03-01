import { IsString, Matches } from 'class-validator'

export class LoginInputDTO {
  @IsString()
  @Matches(/^\S+$/, {
    message: 'Title should not consist of whitespace characters',
  })
  loginOrEmail: string

  @IsString()
  @Matches(/^\S+$/, {
    message: 'Title should not consist of whitespace characters',
  })
  password: string
}

export interface reqSessionDTOType {
    loginIp: SessionIpModel
    refreshTokenIssuedAt: number
    deviceName: DeviceNameModel
    userId: string
    deviceId: string
}

export type SessionIpModel = string
export type DeviceNameModel = string

export interface SessionUpdateFilterModel {
    RFTokenIAT: Date
    deviceId: string
    userId: string
}

export interface SessionViewModel {
    ip: string
    title: string
    lastActiveDate: string
    deviceId: string
}

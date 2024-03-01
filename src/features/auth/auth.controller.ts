import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  Ip,
  NotFoundException,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common'
import { UserInputModel } from '../users/models/users.models.sql'
import { type reqSessionDTOType } from './models/auth.models-sql'
import { Response } from 'express'
import {
  ExistingEmailGuard,
  VerifyRefreshTokenGuard,
} from './guards/auth.guard'
import { LocalAuthGuard } from './guards/local-auth.guard'
import { CommandBus } from '@nestjs/cqrs'
import { CreateUserCommand } from '../users/use-cases/CreateUserUseCase'
import { RegisterSessionCommand } from './use-cases/RegisterSessionUseCase'
import { DeleteSessionCommand } from './use-cases/DeleteSessionUseCase'
import { UpdateSessionCommand } from './use-cases/UpdateSessionUseCase'
import { ThrottlerGuard } from '@nestjs/throttler'
import { UsersQueryRepoSQL } from '../users/users.query-repo-sql'
import { JwtService } from './jwt.service'
import { CheckUserIdGuard } from './guards/сheck-user-Id.guard'
import {
  ApiBasicAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { ApiBadRequestResponse } from '../../helpers/general-types'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersQueryRepo: UsersQueryRepoSQL,
    private readonly commandBus: CommandBus,
  ) {}

  @ApiOperation({ summary: 'Register user' })
  @ApiOkResponse({ description: 'Пользователь успешно зарегистрирован' })
  @ApiResponse({
    status: 400,
    description:
      '\t\n' +
      'Ошибка в данных регистрации или пользователь с таким email уже существует',
    type: ApiBadRequestResponse,
  })
  @Post('registration')
  @HttpCode(204)
  @UseGuards(ThrottlerGuard, ExistingEmailGuard)
  async register(@Body() inputModel: UserInputModel): Promise<void> {
    const createdUser = await this.commandBus.execute(
      new CreateUserCommand(inputModel, false),
    )
    if (createdUser.data === null) {
      throw new HttpException('BAD REQUEST', HttpStatus.BAD_REQUEST)
    }
  }

  @ApiOperation({ summary: 'Login user' })
  @ApiBasicAuth()
  @ApiOkResponse({ description: 'Возвращает JWT accessToken в body и JWT refreshToken в cookie (http-only, secure)' })
  @ApiResponse({
    status: 401,
    description: 'Неверный email или пароль',
  })
  @Post('login')
  @UseGuards(ThrottlerGuard, LocalAuthGuard)
  @HttpCode(200)
  async login(
    @Headers() loginHeaders: any,
    @Ip() IP: string,
    @Res({ passthrough: true }) response: Response,
    @Request() req: any,
  ): Promise<any> {
    const user = req.user

    const accessToken = await this.jwtService.createJWT(user)
    const deviceId = (+new Date()).toString()
    const refreshToken = await this.jwtService.createJWTRefresh(user, deviceId)

    // Подготавливаем данные для записи в таблицу сессий
    const RFTokenInfo = await this.jwtService.getInfoFromRFToken(refreshToken)
    if (RFTokenInfo === null) {
      throw new HttpException('RFToken not provided', HttpStatus.BAD_REQUEST)
    }
    const loginIp = IP || loginHeaders['x-forwarded-for'] || 'IP undefined'
    const deviceName: string =
      loginHeaders['user-agent'] || 'deviceName undefined'

    // Фиксируем сессию
    const sessionDTO: reqSessionDTOType = {
      loginIp,
      refreshTokenIssuedAt: RFTokenInfo.iat,
      deviceName,
      userId: user.id,
      deviceId,
    }
    const sessionRegInfo = await this.commandBus.execute(
      new RegisterSessionCommand(sessionDTO),
    )
    if (sessionRegInfo === false) {
      throw new HttpException(
        'Не удалось залогиниться. Попроубуйте позднее',
        HttpStatus.UNAUTHORIZED,
      )
    }

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
    })
    return { accessToken }
  }

  @ApiOperation({
    summary: 'Logout user',
    description:
      'Для успешного вылогинивания в куках должен быть валидный refreshToken (который будет отозван)',
  })
  @Post('logout')
  @ApiResponse({
    status: 204,
    description: 'Пользователь вылогинился',
  })
  @ApiResponse({
    status: 401,
    description: 'JWT refreshToken внутри cookie отсутствует, истёк или некорректный',
  })
  @HttpCode(204)
  @UseGuards(CheckUserIdGuard)
  @UseGuards(VerifyRefreshTokenGuard)
  async logout(@Request() req: any): Promise<any> {
    const RFTokenInfo = await this.jwtService.getInfoFromRFToken(
      req.cookies.refreshToken,
    )
    if (RFTokenInfo === null) {
      throw new HttpException(
        'Не удалось вылогиниться. Попроубуйте позднее',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    // Удаляем запись с текущей сессией из БД
    const deletionStatus = await this.commandBus.execute(
      new DeleteSessionCommand(RFTokenInfo.iat, req.userId),
    )

    if (!deletionStatus) {
      throw new NotFoundException()
    }
  }

  @ApiOperation({
    summary: 'Get new pair of JWT tokens',
    description:
      'Генерируется новая пара токенов (refresh и access). Для этого в куках с клиента должен быть отправлен актуальный refreshToken, который после обновления будет отозван',
  })
  @ApiResponse({
    status: 200,
    description: 'Возвращает JWT accessToken в body и JWT refreshToken в cookie (http-only, secure)',
  })
  @ApiResponse({
    status: 401,
    description: 'JWT refreshToken внутри cookie отсутствует, истёк или некорректный',
  })
  @Post('refresh-token')
  @HttpCode(200)
  @UseGuards(VerifyRefreshTokenGuard)
  async updateTokens(
    @Headers() loginHeaders: any,
    @Ip() IP: string,
    @Res({ passthrough: true }) response: Response,
    @Request() req: any,
  ): Promise<any> {
    const foundUser = await this.usersQueryRepo.findUserById(req.userId)

    if (!foundUser) {
      throw new HttpException(
        'Не удалось залогиниться. Попроубуйте позднее',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    const accessTokenNew = await this.jwtService.createJWT(foundUser)

    // Получаем данные о текущем токене
    const CurrentRFTokenInfo = await this.jwtService.getInfoFromRFToken(
      req.cookies.refreshToken,
    )
    if (!CurrentRFTokenInfo) {
      throw new HttpException(
        'Не удалось залогиниться. Попроубуйте позднее',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    // Генерируем новый RT
    const refreshTokenNew = await this.jwtService.createJWTRefresh(
      foundUser,
      CurrentRFTokenInfo.deviceId,
    )

    // Подготавливаем данные для записи в таблицу сессий
    const FRTokenInfo =
      await this.jwtService.getInfoFromRFToken(refreshTokenNew)
    if (FRTokenInfo === null) {
      throw new HttpException(
        'Не удалось залогиниться. Попроубуйте позднее',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
    const loginIp = IP || loginHeaders['x-forwarded-for'] || 'IP undefined'
    const deviceName: string =
      loginHeaders['user-agent'] || 'deviceName undefined'

    // Обновляем запись в списке сессий
    const sessionRegInfoNew = await this.commandBus.execute(
      new UpdateSessionCommand(
        CurrentRFTokenInfo.iat,
        CurrentRFTokenInfo.deviceId,
        loginIp,
        FRTokenInfo.iat,
        deviceName,
        req.userId,
      ),
    )
    if (!sessionRegInfoNew) {
      throw new HttpException(
        'Не удалось залогиниться. Попроубуйте позднее',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    response.cookie('refreshToken', refreshTokenNew, {
      httpOnly: true,
      secure: true,
    })
    return { accessToken: accessTokenNew }
  }
}

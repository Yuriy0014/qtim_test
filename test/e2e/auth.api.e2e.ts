import request from 'supertest'

import { HttpStatus, type INestApplication } from '@nestjs/common'
import { type UserInputModel } from '../../src/features/users/models/users.models.sql'
import { createTestAPP } from '../utils/createTestAPP'
import { Paths } from '../utils/paths'

describe('/Testing auth', () => {
  const authData1 = {
    login: 'Landau',
    password: 'LandauMIPT144',
    email: 'ylogachev-sfedu@mail.ru',
  }
  let app: INestApplication
  let server: any
  let accessToken1: string
  let accessToken1OLD: string
  let refreshToken1: string
  let refreshToken1OLD: string

  beforeAll(async () => {
    app = await createTestAPP()
    server = app.getHttpServer()
  })

  afterAll(async () => {
    await app.close()
  })

  it('Delete all data before tests', async () => {
    await request(server)
      .delete(`${Paths.testing}/all-data`)
      .expect(HttpStatus.NO_CONTENT)
  })

  it('Неуспешная регистрация при отсутствии поля password', async () => {
    const userDataWithoutPassword = {
      login: 'TestUser',
      email: 'testuser@example.com',
    }

    await request(app.getHttpServer())
      .post(`${Paths.auth}/registration`)
      .send(userDataWithoutPassword)
      .expect(HttpStatus.BAD_REQUEST)
  })

  it('Неуспешная регистрация при отсутствии поля email', async () => {
    const userDataWithoutEmail = {
      login: 'TestUser',
      password: 'StrongPass1',
    }

    await request(app.getHttpServer())
      .post(`${Paths.auth}/registration`)
      .send(userDataWithoutEmail)
      .expect(HttpStatus.BAD_REQUEST)
  })

  it('Неуспешная регистрация при невалидной длине login', async () => {
    const userData = {
      login: 'Us', // Слишком короткий login
      password: 'StrongPass1',
      email: 'user@example.com',
    }

    await request(app.getHttpServer())
      .post(`${Paths.auth}/registration`)
      .send(userData)
      .expect(HttpStatus.BAD_REQUEST)
  })

  it('Неуспешная регистрация при недопустимых символах в login', async () => {
    const userData = {
      login: 'Invalid_User!', // Недопустимые символы в login
      password: 'StrongPass1',
      email: 'user@example.com',
    }

    await request(app.getHttpServer())
      .post(`${Paths.auth}/registration`)
      .send(userData)
      .expect(HttpStatus.BAD_REQUEST)
  })

  it('Неуспешная регистрация при слишком коротком password', async () => {
    const userData = {
      login: 'ValidUser',
      password: 'Short', // Слишком короткий password
      email: 'user@example.com',
    }

    await request(app.getHttpServer())
      .post(`${Paths.auth}/registration`)
      .send(userData)
      .expect(HttpStatus.BAD_REQUEST)
  })

  it('Неуспешная регистрация при password из пробелов', async () => {
    const userData = {
      login: 'ValidUser',
      password: '         ', // Пробелы в password
      email: 'user@example.com',
    }

    await request(app.getHttpServer())
      .post(`${Paths.auth}/registration`)
      .send(userData)
      .expect(HttpStatus.BAD_REQUEST)
  })

  it('Неуспешная регистрация при невалидном email', async () => {
    const userData = {
      login: 'ValidUser',
      password: 'StrongPass1',
      email: 'invalid-email', // Невалидный email
    }

    await request(app.getHttpServer())
      .post(`${Paths.auth}/registration`)
      .send(userData)
      .expect(HttpStatus.BAD_REQUEST)
  })

  it('Registration 1', async () => {
    const data: UserInputModel = {
      ...authData1
    }

    await request(server)
      .post(`${Paths.auth}/registration`)
      .send(data)
      .expect(HttpStatus.NO_CONTENT)
  })

  it('Registration 2', async () => {
    const data: UserInputModel = {
      login: 'Landau_2',
      password: 'LandauSFEDU12',
      email: 'LandauSFEDU12@gmailya.com',
    }

    await request(server)
      .post(`${Paths.auth}/registration`)
      .send(data)
      .expect(HttpStatus.NO_CONTENT)
  })

  /// /////
  /// Логин
  /// ////

  it('Логин несуществующего юзера', async () => {
    const data = {
      loginOrEmail: 'test_test@test.ru',
      password: 'testPass',
    }
    await request(server)
      .post(`${Paths.auth}/login`)
      .send(data)
      .expect(HttpStatus.UNAUTHORIZED)
  })

  it('Логин существующего юзера c неверным паролем', async () => {
    const data1 = {
      loginOrEmail: authData1.login,
      password: 'testPass',
    }

    await request(server)
      .post(`${Paths.auth}/login`)
      .send(data1)
      .expect(HttpStatus.UNAUTHORIZED)
  })

  it('Логин успешный profile1', async () => {
    const data = {
      loginOrEmail: authData1.login,
      password: authData1.password,
    }
    const response = await request(server)
      .post(`${Paths.auth}/login`)
      .send(data)
      .expect(HttpStatus.OK)

    accessToken1 = response.body.accessToken
    // Проверка наличия access токена
    expect(response.body).toHaveProperty('accessToken')
    expect(accessToken1).toEqual(expect.any(String)) // Проверка на тип строка
    expect(accessToken1).not.toBe('') // Проверка на пустую строку

    // Предположим, что response.headers['set-cookie'] - это строка
    expect(response.headers['set-cookie']).toBeDefined()

    // Преобразуем строку в массив, разделяя её по запятой и пробелу
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const cookiesArray: string[] = response.headers['set-cookie']

    // Находим refreshToken
    const refreshTokenCookie = cookiesArray.find((cookie) =>
      cookie.startsWith('refreshToken='),
    )
    expect(refreshTokenCookie).toBeDefined()

    // Извлекаем значение токена
    refreshToken1 = refreshTokenCookie!.split('=')[1]
    expect(refreshToken1).toBeTruthy()
    expect(refreshToken1).toEqual(expect.any(String)) // Проверка на тип строка
    expect(refreshToken1).not.toBe('') // Проверка на пустую строку
  })

  it('Получение новой пары JWT успешное', async () => {
    // Функция для создания задержки т.к. польхователи могут создаться однвременно, что влияет на тесты.
    const delay = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    // Пауза в 1 секунду
    await delay(3000)

    const response22 = await request(server)
        .post(`${Paths.auth}/refresh-token`)
        .set('Cookie', [`refreshToken=${refreshToken1}`]) // Установка cookie
        .expect(HttpStatus.OK)

    accessToken1OLD = accessToken1
    refreshToken1OLD = refreshToken1

    accessToken1 = response22.body.accessToken
    // Проверка наличия access токена
    expect(response22.body).toHaveProperty('accessToken')
    expect(accessToken1).toEqual(expect.any(String)) // Проверка на тип строка
    expect(accessToken1).not.toBe('') // Проверка на пустую строку

    // Предположим, что response.headers['set-cookie'] - это строка
    expect(response22.headers['set-cookie']).toBeDefined()

    // Преобразуем строку в массив, разделяя её по запятой и пробелу
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const cookiesArray: string[] = response22.headers['set-cookie']

    // Находим refreshToken
    const refreshTokenCookie = cookiesArray.find(cookie => cookie.startsWith('refreshToken='))
    expect(refreshTokenCookie).toBeDefined()

    // Извлекаем значение токена
    refreshToken1 = refreshTokenCookie!.split('=')[1]
    expect(refreshToken1).toBeTruthy()
    expect(refreshToken1).toEqual(expect.any(String)) // Проверка на тип строка
    expect(refreshToken1).not.toBe('') // Проверка на пустую строку
  })

  it('Получение новой пары JWT c старым RF token (но по дате еще действителен) 401', async () => {
    await request(server)
        .post(`${Paths.auth}/refresh-token`)
        .set('Cookie', [`refreshToken=${refreshToken1OLD}`]) // Установка cookie
        .expect(HttpStatus.UNAUTHORIZED)
  })

  it('Попытка вылогиниться с неактуальным RFToken 401', async () => {
    await request(server)
        .post(`${Paths.auth}/logout`)
        .set('Cookie', [`refreshToken=${refreshToken1OLD}`]) // Установка cookie
        .expect(HttpStatus.UNAUTHORIZED)
  })

  it('Логаут успешный', async () => {
    await request(server)
        .post(`${Paths.auth}/logout`)
        .set('Cookie', [`refreshToken=${refreshToken1}`]) // Установка cookie
        .expect(HttpStatus.NO_CONTENT)
  })

  it('Логаут повторный 401', async () => {
    await request(server)
        .post(`${Paths.auth}/logout`)
        .set('Cookie', [`refreshToken=${refreshToken1}`]) // Установка cookie
        .expect(HttpStatus.UNAUTHORIZED)
  })

  it('Получение новой пары JWT после логаута', async () => {
    await request(server)
        .post(`${Paths.auth}/logout`)
        .set('Cookie', [`refreshToken=${refreshToken1}`]) // Установка cookie
        .expect(HttpStatus.UNAUTHORIZED)
  })
})

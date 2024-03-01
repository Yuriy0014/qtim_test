import request from 'supertest'
import { HttpStatus, type INestApplication } from '@nestjs/common'
import { createTestAPP } from '../utils/createTestAPP'
import { Paths } from '../utils/paths'

describe('/Testing articles', () => {
  let app: INestApplication
  let server: any
  let accessTokenUser1: string
  let accessTokenUser2: string
  let createdArticleId: string

  beforeAll(async () => {
    app = await createTestAPP()
    server = app.getHttpServer()

    // Очистка всех данных перед началом тестов
    await request(server)
      .delete(`${Paths.testing}/all-data`)
      .expect(HttpStatus.NO_CONTENT)

    // Регистрация первого пользователя
    await request(server)
      .post(`${Paths.auth}/registration`)
      .send({
        login: 'Landau',
        password: 'LandauMIPT144',
        email: 'ylogachev-sfedu@mail.ru',
      })
      .expect(HttpStatus.NO_CONTENT)

    // Логин первого пользователя для получения accessToken
    let response = await request(server)
      .post(`${Paths.auth}/login`)
      .send({
        loginOrEmail: 'Landau',
        password: 'LandauMIPT144',
      })
      .expect(HttpStatus.OK)
    accessTokenUser1 = response.body.accessToken

    // Регистрация второго пользователя
    await request(server)
      .post(`${Paths.auth}/registration`)
      .send({
        login: 'Landau_2',
        password: 'LandauSFEDU12',
        email: 'LandauSFEDU12@gmailya.com',
      })
      .expect(HttpStatus.NO_CONTENT)

    // Логин второго пользователя для получения accessToken
    response = await request(server)
      .post(`${Paths.auth}/login`)
      .send({
        loginOrEmail: 'Landau_2',
        password: 'LandauSFEDU12',
      })
      .expect(HttpStatus.OK)
    accessTokenUser2 = response.body.accessToken
  })

  afterAll(async () => {
    await app.close()
  })

  // Негативные тесты: Валидация данных при создании статьи
  it('Создание статьи без title должно возвращать ошибку', async () => {
    const articleData = {
      description: 'Valid description longer than 10 characters.',
    }

    await request(server)
      .post(`${Paths.articles}`)
      .set('Authorization', `Bearer ${accessTokenUser1}`)
      .send(articleData)
      .expect(HttpStatus.BAD_REQUEST)
  })

  it('Создание статьи с title меньше 5 символов должно возвращать ошибку', async () => {
    const articleData = {
      title: 'Shrt',
      description: 'Valid description longer than 10 characters.',
    }

    await request(server)
      .post(`${Paths.articles}`)
      .send(articleData)
      .set('Authorization', `Bearer ${accessTokenUser1}`)
      .expect(HttpStatus.BAD_REQUEST)
  })

  it('Создание статьи с title, состоящим только из пробелов, должно возвращать ошибку', async () => {
    const articleData = {
      title: '     ',
      description: 'Valid description longer than 10 characters.',
    }

    await request(server)
      .post(`${Paths.articles}`)
      .set('Authorization', `Bearer ${accessTokenUser1}`)
      .send(articleData)
      .expect(HttpStatus.BAD_REQUEST)
  })

  it('Создание статьи без description должно возвращать ошибку', async () => {
    const articleData = {
      title: 'Valid Title',
    }

    await request(server)
      .post(`${Paths.articles}`)
      .set('Authorization', `Bearer ${accessTokenUser1}`)
      .send(articleData)
      .expect(HttpStatus.BAD_REQUEST)
  })

  it('Создание статьи с description меньше 10 символов должно возвращать ошибку', async () => {
    const articleData = {
      title: 'Valid Title',
      description: 'Short',
    }

    await request(server)
      .post(`${Paths.articles}`)
      .set('Authorization', `Bearer ${accessTokenUser1}`)
      .send(articleData)
      .expect(HttpStatus.BAD_REQUEST)
  })

  // Негативные тесты: Обновление статьи
  it('Обновление несуществующей статьи должно возвращать ошибку', async () => {
    const articleData = {
      title: 'Updated Valid Title',
      description: 'Updated valid description longer than 10 characters.',
    }

    await request(server)
      .put(`${Paths.articles}/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${accessTokenUser1}`)
      .send(articleData)
      .expect(HttpStatus.NOT_FOUND)
  })

  it('Успешное создание статьи и получение её ID', async () => {
    const newArticle = {
      title: 'Example Article',
      description: 'This is an example of a successfully created article.',
    }

    const response = await request(server)
      .post(`${Paths.articles}`)
      .set('Authorization', `Bearer ${accessTokenUser1}`)
      .send(newArticle)
      .expect(HttpStatus.CREATED)

    // Проверяем, что в ответе есть ID и другие поля статьи
    expect(response.body).toHaveProperty('id')
    expect(response.body.title).toEqual(newArticle.title)
    expect(response.body.description).toEqual(newArticle.description)

    createdArticleId = response.body.id
  })

  it('Попытка обновления статьи без аутентификации должна возвращать ошибку', async () => {
    const articleData = {
      title: 'Updated Title',
      description: 'Updated description longer than 10 characters.',
    }

    await request(server)
      .put(`${Paths.articles}/${createdArticleId}`)
      .send(articleData)
      .expect(HttpStatus.UNAUTHORIZED)
  })

  // Негативные тесты: Удаление статьи
  it('Удаление несуществующей статьи должно возвращать ошибку', async () => {
    await request(server)
      .delete(`${Paths.articles}/00000000-0000-0000-0000-000000000000`)
      .set('Authorization', `Bearer ${accessTokenUser1}`)
      .expect(HttpStatus.NOT_FOUND)
  })

  it('Попытка удаления статьи без аутентификации должна возвращать ошибку', async () => {
    await request(server)
      .delete(`${Paths.articles}/${createdArticleId}`)
      .expect(HttpStatus.UNAUTHORIZED)
  })

  // Негативные тесты: Авторизация и права доступа
  it('Попытка обновления статьи пользователем, который не является автором, должна возвращать ошибку', async () => {
    const articleData = {
      title: 'Valid Title',
      description: 'Valid description longer than 10 characters.',
    }

    await request(server)
      .put(`${Paths.articles}/${createdArticleId}`)
      .send(articleData)
        .set('Authorization', `Bearer ${accessTokenUser2}`)
      .expect(HttpStatus.FORBIDDEN)
  })

  it('Попытка удаления статьи пользователем, который не является автором, должна возвращать ошибку', async () => {
    await request(server)
      .delete(`${Paths.articles}/${createdArticleId}`)
        .set('Authorization', `Bearer ${accessTokenUser2}`)
      .expect(HttpStatus.FORBIDDEN)
  })

  // Негативные тесты: Доступ
  it('Попытка создания статьи без аутентификации должна возвращать ошибку', async () => {
    const articleData = {
      title: 'Valid Title',
      description: 'Valid description longer than 10 characters.',
    }

    await request(server)
      .post(`${Paths.articles}`)
      .send(articleData)
      .expect(HttpStatus.UNAUTHORIZED)
  })

  it('Успешное получение статьи по ID', async () => {
    await request(server)
        .get(`/articles/${createdArticleId}`)
        .set('Authorization', `Bearer ${accessTokenUser1}`)
        .expect(HttpStatus.OK)
        .then(response => {
          expect(response.body).toHaveProperty('id', createdArticleId)
          expect(response.body).toHaveProperty('title')
          expect(response.body).toHaveProperty('description')
        })
  })

  it('Успешное обновление статьи', async () => {
    const updatedArticleData = {
      title: 'Updated Article',
      description: 'This is an updated description.'
    }

    await request(server)
        .put(`/articles/${createdArticleId}`)
        .set('Authorization', `Bearer ${accessTokenUser1}`)
        .send(updatedArticleData)
        .expect(HttpStatus.OK)
  })

  it('Успешное удаление статьи', async () => {
    await request(server)
        .delete(`/articles/${createdArticleId}`)
        .set('Authorization', `Bearer ${accessTokenUser1}`)
        .expect(HttpStatus.NO_CONTENT)
  })
})

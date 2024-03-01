import * as process from 'process'
import { DataSource } from 'typeorm'
import { join } from 'path'
import * as dotenv from 'dotenv'
dotenv.config()

// Получение переменных из окружения
const PG_NAME = process.env.PG_NAME
const PG_PASS = process.env.PG_PASS

// Проверка, что переменные были установлены
if (!PG_NAME || !PG_PASS) {
  throw new Error('🚨 Не удалось получить переменные окружения для подключения к базе данных')
}

// Создание DataSource с использованием переменных окружения
const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: PG_NAME,
  password: PG_PASS,
  database: 'qtim_test',
  entities: [join(__dirname, '..', 'features', 'articles', 'entities', '*.entity.{ts,js}'),
    join(__dirname, '..', 'features', 'auth', 'entities', '*.entity.{ts,js}'),
    join(__dirname, '..', 'features', 'users', 'entities', '*.entity.{ts,js}')],
  // eslint-disable-next-line n/no-path-concat
  migrations: [join(__dirname, 'migrations', '**', '*{.ts,.js}')],
  synchronize: false
})

export default dataSource

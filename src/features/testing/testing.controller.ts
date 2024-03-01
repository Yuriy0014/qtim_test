import { Controller, Delete, HttpCode, } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('For e2e tests')
@Controller('testing')
export class TestingController {
    constructor(@InjectDataSource() protected dataSource: DataSource) {
    }

    @Delete('all-data')
    @HttpCode(204)
    async deleteAll() {
        await this.dataSource.query(`DELETE
                                     FROM public.sessions`)
        await this.dataSource.query(`DELETE
                                     FROM public.articles`)
        await this.dataSource.query(`DELETE
                                     FROM public.users`)
    }
}

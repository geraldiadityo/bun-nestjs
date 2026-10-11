import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Put, Query, UsePipes, ValidationPipe } from "@nestjs/common";
import { PenggunaService } from "./pengguna.service";
import { PenggunaRequestDTO, PenggunaResponse, PenggunaUpdateRequest } from "./pengguna.model";
import { ApiResponse, QueryStandart } from "../../utils/web.model";

@Controller('/api/pengguna/user')
export class PenggunaController {
    constructor (
        private service: PenggunaService
    ) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() request: PenggunaRequestDTO
    ): Promise<ApiResponse<PenggunaResponse>> {
        const result = await this.service.createPengguna(request);

        return {
            data: result,
            message: `success create pengguna with username ${result.username}`
        }
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    async getAll(
        @Query() query: QueryStandart,
    ): Promise<ApiResponse<PenggunaResponse[]>> {
        const { data, meta } = await this.service.getAll(query);
        
        return {
            data: data,
            message: 'success',
            totalItem: meta.totalItem,
            totalPage: meta.totalPage,
            currentPage: meta.currentPage
        }
    }

    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    async getById(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<ApiResponse<PenggunaResponse>> {
        const result = await this.service.penggunaMustExist(id)

        return {
            data: result,
            message: 'success'
        }
    }

    @Put('/:id')
    @HttpCode(HttpStatus.OK)
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() request: PenggunaUpdateRequest
    ): Promise<ApiResponse<PenggunaResponse>> {
        const result = await this.service.updatePengguna(id, request);

        return {
            data: result,
            message: 'success update data pengguna'
        }
    }

    @Patch('/:id')
    @HttpCode(HttpStatus.OK)
    async changeStatus(
        @Param('id', ParseIntPipe) id: number
    ): Promise<ApiResponse<PenggunaResponse>> {
        const result = await this.service.changeStatus(id);
        
        return {
            data: result,
            message: 'success'
        }
    }
}
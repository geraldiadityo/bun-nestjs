import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, Query, UsePipes, ValidationPipe } from "@nestjs/common";
import { PegawaiService } from "./pegawai.service";
import { PegawaiQueryOptions, PegawaiRequestDTO, PegawaiResponse } from "./pegawai.model";
import { ApiResponse } from "../../utils/web.model";

@Controller('/api/pengguna/pegawai')
export class PegawaiController {
    constructor(
        private service: PegawaiService
    ) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() request: PegawaiRequestDTO
    ): Promise<ApiResponse<PegawaiResponse>> {
        const result = await this.service.createPegawai(request);
        
        return {
            data: result,
            message: `Success create pegawai with NK: ${result.nk}`
        }
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    async getAll(
        @Query() query: PegawaiQueryOptions
    ): Promise<ApiResponse<PegawaiResponse[]>> {
        const { data, meta } = await this.service.getAll(query)

        return {
            data: data,
            message: 'success',
            totalItem: meta.totalItem,
            totalPage: meta.totalPage,
            currentPage: meta.currentPage
        }
    }

    @Put('/:id')
    @HttpCode(HttpStatus.OK)
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() request: PegawaiRequestDTO,
    ): Promise<ApiResponse<PegawaiResponse>> {
        const result = await this.service.updatePegawai(id, request)

        return {
            data: result,
            message: `Success update pegawai ${result.nk}`
        }
    }

    @Delete('/:id')
    @HttpCode(HttpStatus.OK)
    async remove(
        @Param('id', ParseIntPipe) id: number
    ): Promise<ApiResponse<boolean>> {
        await this.service.deletePegawai(id);

        return {
            data: true,
            message: 'Success removed data pegawai'
        }
    }

    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    async getById(
        @Param('id', ParseIntPipe) id: number
    ): Promise<ApiResponse<PegawaiResponse>> {
        const result = await this.service.pegawaiMustExist(id)

        return {
            data: result,
            message: 'success'
        }
    }
}
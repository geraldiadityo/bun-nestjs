import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put } from "@nestjs/common";
import { RoleService } from "./role.service";
import { ApiResponse } from "../../utils/web.model";
import { RoleCreateDTO, RoleResponse } from "./role.model";

@Controller('/api/pengguna/role')
export class RoleController {
    constructor (
        private service: RoleService
    ) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    async getAll(): Promise<ApiResponse<RoleResponse[]>> {
        const result = await this.service.getAllRole();
        
        return {
            data: result,
            message: 'success'
        }
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() request: RoleCreateDTO
    ): Promise<ApiResponse<RoleResponse>> {
        const result = await this.service.createRole(request);

        return {
            data: result,
            message: `Success create new role ${result.nama}`
        }
    }

    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    async getById(
        @Param('id', ParseIntPipe) id: number
    ): Promise<ApiResponse<RoleResponse>> {
        const result = await this.service.roleMustExist(id)

        return {
            data: result,
            message: 'success'
        }
    }

    @Put('/:id')
    @HttpCode(HttpStatus.OK)
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() request: RoleCreateDTO
    ): Promise<ApiResponse<RoleResponse>> {
        const result = await this.service.updateRole(id, request)

        return {
            data: result,
            message: `Success updated data role`
        }
    }

    @Delete('/:id')
    @HttpCode(HttpStatus.OK)
    async remove(
        @Param('id', ParseIntPipe) id: number
    ): Promise<ApiResponse<boolean>> {
        const result = await this.service.removeRole(id);

        return {
            data: true,
            message: `Success remove data role ${result.nama}`
        }
    }
}
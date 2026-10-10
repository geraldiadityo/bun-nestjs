import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { RoleRepository } from "./role.repository";
import { PrismaService } from "../../common/prisma.service";
import { Prisma, Role } from "@prisma/client";
import { RoleCreateDTO, RoleResponse } from "./role.model";

@Injectable()
export class RoleService {
    private readonly logger = new Logger("RoleService")
    constructor(
        private repo: RoleRepository,
        private prisma: PrismaService
    ) {}

    private toRoleResponse(data: Role): RoleResponse {
        return {
            id: data.id,
            nama: data.nama
        }
    }

    private async checkName(
        nama: string,
        tx?: Prisma.TransactionClient
    ): Promise<RoleResponse | null> {
        this.logger.debug(`get data role with nama: ${nama}`)
        const data = await this.repo.findByName(nama.toLowerCase(), tx);
        if (!data){
            this.logger.warn(`Role with name: ${nama} was not found`)
            return null;
        }

        return this.toRoleResponse(data)
    }

    async roleMustExist(
        id: number,
        tx?: Prisma.TransactionClient
    ): Promise<RoleResponse> {
        this.logger.debug(`get data role with id: ${id}`)
        const data = await this.repo.findById(id, tx);
        if (!data){
            this.logger.warn(`Role with id: ${id} is not found`)
            throw new NotFoundException('Role is does not exist')
        }

        return this.toRoleResponse(data)
    }

    async createRole(
        data: RoleCreateDTO
    ): Promise<RoleResponse> {
        this.logger.log(`starting create new role with name: ${data.nama}`)
        try {
            const newRole = await this.prisma.$transaction(
                async (tx) => {
                    const checkName = await this.checkName(data.nama, tx);
                    if (checkName){
                        this.logger.warn(`role with name: ${checkName.nama} has already exist`)
                        throw new BadRequestException('Role has already exists')
                    }

                    const dataSender: RoleCreateDTO = {
                        nama: data.nama.toLowerCase()
                    }

                    const result = await this.repo.create(dataSender, tx);
                    return result
                }
            )
            this.logger.log(`success create new role ${newRole.nama}`);
            return this.toRoleResponse(newRole)
        } catch (err: any){
            if (err instanceof HttpException){
                throw err
            }

            this.logger.error(`Unexpected error: ${err.message}`)
            throw new InternalServerErrorException('Terjadi kesalahan di server')
        }
    }

    async updateRole(
        id: number,
        data: RoleCreateDTO,
    ): Promise<RoleResponse> {
        this.logger.log(`starting update data role with id: ${id}`)
        try {
            const updatedRole = await this.prisma.$transaction(
                async (tx) => {
                    const currentData = await this.roleMustExist(id, tx);
                    if (data.nama.toLowerCase() !== currentData.nama) {
                        const checkName = await this.checkName(data.nama, tx)
                        if (checkName){
                            this.logger.warn(`role with name: ${data.nama} has already exists`)
                            throw new BadRequestException('Role has already exists')
                        }
                    }
                    
                    const dataSender: RoleCreateDTO = {
                        nama: data.nama.toLowerCase()
                    }

                    const result = await this.repo.update(currentData.id, dataSender, tx);
                    return result
                }
            )
            this.logger.log(`success updated data role with id: ${updatedRole.id}`)
            return this.toRoleResponse(updatedRole)
        } catch (err: any) {
            if (err instanceof HttpException) {
                throw err
            }
            this.logger.error(`Unexpected error: ${err.message}`)
            throw new InternalServerErrorException('Terjadi kesalahan di server')
        }
    }

    async removeRole(
        id: number,
        tx?: Prisma.TransactionClient
    ): Promise<RoleResponse> {
        this.logger.log(`starting remove role with id: ${id}`)
        const currentData = await this.roleMustExist(id, tx);

        const removedData = await this.repo.remove(currentData.id, tx)
        this.logger.log(`success remove data with id: ${removedData.id}`)
        return this.toRoleResponse(removedData)
    }

    async getAllRole(): Promise<RoleResponse[]> {
        this.logger.debug(`get all data role`)
        const listData = await this.repo.findMany();
        return listData.map((item) => this.toRoleResponse(item))
    }
}
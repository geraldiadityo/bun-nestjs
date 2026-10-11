import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { PenggunaRepository } from "./pengguna.repository";
import { PegawaiService } from "../pegawai/pegawai.service";
import { RoleService } from "../role/role.service";
import { PenggunaCreateDTO, PenggunaRequestDTO, PenggunaResponse, PenggunaUpdateRequest } from "./pengguna.model";
import { Pengguna, Prisma } from "@prisma/client";
import * as bcrypt from 'bcryptjs';
import { QueryStandart } from "../../utils/web.model";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class PenggunaService {
    private readonly logger = new Logger("PenggunaService")
    constructor(
        private repo: PenggunaRepository,
        private pegawaiService: PegawaiService,
        private roleService: RoleService,
        private prisma: PrismaService,
    ) {}

    toPenggunaResponse(data: any): PenggunaResponse {
        return {
            id: data.id,
            username: data.username,
            pegawai: data.pegawai,
            role: data.role,
            status: data.status
        }
    }

    async checkUsername(
        username: string,
        tx?: Prisma.TransactionClient
    ): Promise<Pengguna | null> {
        this.logger.debug(`get pengguna with username: ${username}`);
        const data = await this.repo.findByUsername(username, tx);
        if (!data){
            this.logger.warn(`pengguna with username: ${username} is not found`)
            return null
        }

        return data
    }

    async checkPassword(
        data: Pengguna,
        password: string,
    ): Promise<boolean> {
        const compare = await bcrypt.compare(password, data.password);
        if (!compare) {
            return false
        }

        return true;
    }

    async penggunaMustExist(
        id: number,
        tx?: Prisma.TransactionClient
    ): Promise<PenggunaResponse> {
        this.logger.debug(`get pengguna with id: ${id}`)
        const data = await this.repo.findById(id, tx);
        if (!data){
            this.logger.warn(`pengguna with id: ${id} is not found`)
            throw new NotFoundException('pengguna not found')
        }

        return this.toPenggunaResponse(data)
    }

    async getAll(
        query: QueryStandart
    ): Promise<{
        data: PenggunaResponse[],
        meta: any
    }> {
        this.logger.debug('get data pengguna with query options')
        const {page, pageSize, keyword} = query;
        const skip = (page - 1) * pageSize;
        const take = pageSize;
        
        const where: Prisma.PenggunaWhereInput = keyword && keyword.trim() !== "" ? {
            OR: [
                { username: { equals: keyword }},
                { pegawai: { nama: { contains: keyword, mode: 'insensitive' } } },
                { pegawai: { nk: { equals: keyword } } },
                { role: { nama: { equals: keyword } } }
            ]
        } : {}

        const [listData, totalItem] = await Promise.all([
            this.repo.findAll({
                where: where,
                take: take,
                skip: skip
            }),
            this.repo.countAll(where)
        ]);

        if (listData.length === 0) {
            return {
                data: [],
                meta: {
                    totalItem: 0,
                    totalPage: 0,
                    currentPage: page
                }
            }
        }

        const totalPage = Math.ceil(totalItem/pageSize)
        return {
            data: listData.map((item) => this.toPenggunaResponse(item)),
            meta: {
                totalItem: totalItem,
                totalPage: totalPage,
                currentPage: page
            }
        }
    }

    async createPengguna(
        data: PenggunaRequestDTO,
    ): Promise<PenggunaResponse> {
        this.logger.log(`starting create pengguna with username: ${data.username}`)
        try {
            const newPengguna = await this.prisma.$transaction(
                async (tx) => {
                    if (data.password !== data.confirm_password) {
                        this.logger.warn('password and confirm password not exact match')
                        throw new BadRequestException('password and confirm password not exact match')
                    }

                    const checkUsername = await this.checkUsername(data.username, tx);
                    if (checkUsername) {
                        this.logger.warn(`username ${data.username} has already exist`)
                        throw new BadRequestException('Pengguna has already exists')
                    }
                    const pegawai = await this.pegawaiService.pegawaiMustExist(data.pegawaiId, tx);
                    const role = await this.roleService.roleMustExist(data.roleId, tx);
                    const passwordEncrypted = await bcrypt.hash(data.password, 10);
                    
                    const dataSender: PenggunaCreateDTO = {
                        username: data.username,
                        pegawaiId: pegawai.id,
                        roleId: role.id,
                        password: passwordEncrypted
                    }

                    const result = await this.repo.create(dataSender, tx);
                    return result;
                }
            )
            this.logger.log(`success created pengguna with username: ${newPengguna.username}`)
            return this.toPenggunaResponse(newPengguna)
        } catch (err: any) {
            if (err instanceof HttpException) {
                throw err
            }

            this.logger.error(`Unexpected error: ${err.message}`)
            throw new InternalServerErrorException('Terjadi kesalahan di server')
        }
    }

    async updatePengguna(
        id: number,
        data: PenggunaUpdateRequest,
    ): Promise<PenggunaResponse> {
        this.logger.log(`starting update pengguna with id: ${id}`);
        try {
            const updatedPengguna = await this.prisma.$transaction(
                async (tx) => {
                    const updateDataSender: Partial<Pengguna> = {};
                    const currentData = await this.repo.findById(id, tx);
                    if (!currentData) {
                        this.logger.warn(`pengguna with id: ${id} is not found`)
                        throw new NotFoundException('pengguna is not found')
                    }

                    if (data.username !== currentData.username) {
                        const checkUsername = await this.checkUsername(data.username, tx);
                        if (checkUsername) {
                            this.logger.warn(`pengguna with username ${data.username} has already exists`)
                            throw new BadRequestException('Pengguna has already exists')
                        }
                    }
                    if (data.pegawaiId !== currentData.pegawaiId) {
                        const pegawai = await this.pegawaiService.pegawaiMustExist(data.pegawaiId);
                        updateDataSender.pegawaiId = pegawai.id
                    }

                    if (data.roleId !== currentData.roleId) {
                        const role = await this.roleService.roleMustExist(data.roleId, tx);
                        updateDataSender.roleId = role.id
                    }

                    if (data.old_password && data.new_password && data.confirm_password) {
                        const checkPassword = await this.checkPassword(currentData, data.old_password);
                        if (!checkPassword) {
                            this.logger.warn('old password is wrong')
                            throw new UnauthorizedException('old password is wrong')
                        }

                        if (data.new_password !== data.confirm_password) {
                            this.logger.warn('new password and confirm password is not exact match')
                            throw new BadRequestException('new password and confirm password is not exact match')
                        }

                        const newPasswordEncrypted = await bcrypt.hash(data.new_password, 10)
                        updateDataSender.password = newPasswordEncrypted
                    }

                    if (Object.keys(updateDataSender).length === 0) {
                        this.logger.warn(`nothing change in update data pengguna with id: ${currentData.id}`)
                        throw new BadRequestException('nothing change in update data')
                    }

                    const result = await this.repo.update(currentData.id, updateDataSender, tx);
                    return result
                }
            )

            this.logger.log(`success updated data pengguna with id: ${updatedPengguna.id}`)
            return this.toPenggunaResponse(updatedPengguna)
        } catch (err: any) {
            if (err instanceof HttpException) {
                throw err
            }

            this.logger.error(`Unexpected error ${err.message}`)
            throw new InternalServerErrorException('Terjadi kesalahan di server')
        }
    }

    async changeStatus(
        id: number,
        tx?: Prisma.TransactionClient
    ): Promise<PenggunaResponse> {
        this.logger.log(`starting change status pengguna with id: ${id}`)
        const currentData = await this.penggunaMustExist(id, tx);
        const dataSender: Partial<Pengguna> = {
            status: !currentData.status
        }

        const updatedDta = await this.repo.update(currentData.id, dataSender, tx);
        this.logger.log(`success change status pengguna with id: ${updatedDta.id}`)
        return this.toPenggunaResponse(updatedDta)
    }
}
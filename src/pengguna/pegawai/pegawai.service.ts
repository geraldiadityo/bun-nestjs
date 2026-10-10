import { HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { PegawaiRepository } from "./pegawai.repository";
import { DocumentCounterService } from "../../document-counter/document-counter.service";
import { PrismaService } from "../../common/prisma.service";
import { Pegawai, Prisma } from "@prisma/client";
import { PegawaiCreateDTO, PegawaiQueryOptions, PegawaiRequestDTO, PegawaiResponse } from "./pegawai.model";
import { DocumentType } from "../../document-counter/document-counter.model";

@Injectable()
export class PegawaiService {
    private readonly logger = new Logger("PegawaiService")
    constructor(
        private readonly repo: PegawaiRepository,
        private documentCounter: DocumentCounterService,
        private prisma: PrismaService
    ) {}

    private toPegawaiResponse(data: Pegawai): PegawaiResponse {
        return {
            id: data.id,
            nk: data.nk,
            nama: data.nama
        }
    }

    async pegawaiMustExist(
        id: number,
        tx?: Prisma.TransactionClient
    ): Promise<PegawaiResponse> {
        this.logger.debug(`get pegawai with id: ${id}`)
        const data = await this.repo.findById(id, tx);
        if (!data){
            this.logger.warn(`pegawai with id: ${id} does not exist`)
            throw new NotFoundException('Pegawai tidak di temukan')
        }

        return this.toPegawaiResponse(data)
    }

    async createPegawai(
        data: PegawaiRequestDTO
    ): Promise<PegawaiResponse> {
        this.logger.log(`starting create pegawai with nama: ${data.nama}`)
        const tanggal = new Date()
        try {
            const newPegawai = await this.prisma.$transaction(
                async (tx) => {
                    const newNumberPegawai = await this.documentCounter.generate(tx, DocumentType.PEGAWAI, tanggal);
                    const dataSender: PegawaiCreateDTO = {
                        nk: newNumberPegawai,
                        nama: data.nama
                    }

                    const newData = await this.repo.create(dataSender, tx);
                    return newData;
                }
            )
            this.logger.log(`Success create pegawai with nama: ${newPegawai.nama}`)
            return this.toPegawaiResponse(newPegawai)
        } catch (err: any){
            if (err instanceof HttpException) {
                throw err
            }

            this.logger.error(`Unexpected error: ${err.message}`)
            throw new InternalServerErrorException('Terjadi kesalahan di server')
        }
    }

    async updatePegawai(
        id: number,
        data: PegawaiRequestDTO
    ): Promise<PegawaiResponse> {
        this.logger.log(`starting update pegawai with id: ${id}`)
        try {
            const updatedPegawai = await this.prisma.$transaction(
                async (tx) => {
                    const currentData = await this.pegawaiMustExist(id, tx);
                    const dataSender = {
                        nama: data.nama
                    };
                    
                    const updateData = await this.repo.update(currentData.id, dataSender, tx);
                    return updateData;
                }
            )
            this.logger.log(`Success update data pegawai with id: ${id}`);
            return this.toPegawaiResponse(updatedPegawai)
        } catch (err: any){
            if (err instanceof HttpException) {
                throw err
            }

            this.logger.error(`Unexpected error: ${err.message}`)
            throw new InternalServerErrorException('Terjadi kesalahan di server')
        }
    }

    async deletePegawai(
        id: number,
        tx?: Prisma.TransactionClient
    ): Promise<void> {
        this.logger.log(`starting delete data pegawai with id: ${id}`);
        const currentData = await this.pegawaiMustExist(id, tx);
        const deletedPegawai = await this.repo.remove(currentData.id, tx);
        this.logger.log(`success remove data pegawai with id: ${deletedPegawai.id}`)
    }

    async getAll(
        query: PegawaiQueryOptions
    ): Promise<{
        data: PegawaiResponse[],
        meta: any
    }> {
        this.logger.debug('get all data pegawai with query')
        const { page, pageSize, keyword } = query;
        
        const skip = (page - 1) * pageSize;
        const take = pageSize;

        const where: Prisma.PegawaiWhereInput = keyword && keyword.trim() !== "" ? {
            OR: [
                { nama: {contains: keyword, mode: 'insensitive'} },
                { nk: { startsWith: keyword, mode: 'insensitive'} }
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

        if(listData.length === 0){
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
            data: listData.map((item) => this.toPegawaiResponse(item)),
            meta: {
                totalItem: totalItem,
                totalPage: totalPage,
                currentPage: page
            }
        }
    }
}
import { Injectable, Logger } from "@nestjs/common";
import { CacheRepository } from "../../common/cache.repository";
import { PrismaService } from "../../common/prisma.service";
import { Pegawai, Prisma } from "@prisma/client";
import { PegawaiCreateDTO } from "./pegawai.model";

type FindManyArgs = Parameters<PrismaService['pegawai']['findMany']>[0];
type FindAllArgs = {
    where?: Prisma.PegawaiWhereInput;
    orderBy?: Prisma.PegawaiOrderByWithRelationInput;
    skip?: number;
    take?: number;
}
@Injectable()
export class PegawaiRepository extends CacheRepository {
    private readonly logger = new Logger('PegawaiRepository')

    constructor(
        private prisma: PrismaService
    ) {
        super();
    }

    protected getNamespace(): string {
        return 'pegawai';
    }

    async findMany(
        args: FindManyArgs
    ): Promise<Pegawai[]> {
        const cacheKey = this.getCacheKey(args);
        const cachedData = await this.cache.get<Pegawai[]>(cacheKey);
        
        if (cachedData){
            this.logger.debug('Fetching data from cached');
            return cachedData
        }

        this.logger.debug('Cached miss, fetching data from database');
        const dbData = await this.prisma.pegawai.findMany({
            ...args,
        });

        let isSearchQuery = false;
        const where = args?.where;

        if (where) {
            if (where.OR && Array.isArray(where.OR)){
                isSearchQuery = true
            }
        }

        const TTL = isSearchQuery ? (1000 * 60 * 3) : (1000 * 60 * 10);
        await this.setCacheData(cacheKey, dbData, TTL)
        return dbData
    }

    async findAll(args: FindAllArgs): Promise<Pegawai[]> {
        return await this.findMany(args);
    }

    async countAll(where?: Prisma.PegawaiWhereInput): Promise<number> {
        return await this.prisma.pegawai.count({where})
    }

    async findById(
        id: number,
        tx?: Prisma.TransactionClient
    ): Promise<Pegawai | null> {
        const client = tx || this.prisma;
        return await client.pegawai.findUnique({
            where: {
                id: id
            }
        })
    }

    async create(
        data: PegawaiCreateDTO,
        tx?: Prisma.TransactionClient
    ): Promise<Pegawai> {
        const client = tx || this.prisma;
        const result = await client.pegawai.create({
            data: data
        });

        await this.invalidateNamespace();
        return result
    }

    async update(
        id: number,
        data: Partial<Pegawai>,
        tx?: Prisma.TransactionClient
    ): Promise<Pegawai> {
        const client = tx || this.prisma;
        const result = await client.pegawai.update({
            where: {
                id: id
            },
            data: data
        })

        await this.invalidateNamespace();
        return result;
    }

    async remove(
        id: number,
        tx?: Prisma.TransactionClient
    ): Promise<Pegawai> {
        const client = tx || this.prisma;
        const result = await client.pegawai.delete({
            where: {
                id: id
            }
        })

        await this.invalidateNamespace()
        return result
    }
}
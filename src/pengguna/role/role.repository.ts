import { Injectable, Logger } from "@nestjs/common";
import { CacheRepository } from "../../common/cache.repository";
import { PrismaService } from "../../common/prisma.service";
import { Prisma, Role } from "@prisma/client";
import { RoleCreateDTO } from "./role.model";

@Injectable()
export class RoleRepository extends CacheRepository {
    private readonly logger = new Logger("RoleRepository")

    constructor(
        private prisma: PrismaService
    ) {
        super();
    }

    protected getNamespace(): string {
        return 'role'
    }

    async findMany(): Promise<Role[]> {
        const cacheKey = this.getCacheKey('role');
        const cachedData = await this.cache.get<Role[]>(cacheKey);
        
        if (cachedData){
            this.logger.debug('Fetching data from cached')
            return cachedData
        }

        this.logger.debug('Cache miss, fetching data from database');
        const dbData = await this.prisma.role.findMany();
        
        await this.setCacheData(cacheKey, dbData, 1000 * 60 * 10);
        return dbData;
    }

    async findById(
        id: number,
        tx?: Prisma.TransactionClient
    ): Promise<Role | null> {
        const client = tx || this.prisma;
        return await client.role.findUnique({
            where: {
                id: id
            }
        })
    }

    async findByName(
        nama: string,
        tx?: Prisma.TransactionClient
    ): Promise<Role | null> {
        const client = tx || this.prisma;
        return await client.role.findUnique({
            where: {
                nama: nama
            }
        })
    }

    async create(
        data: RoleCreateDTO,
        tx?: Prisma.TransactionClient
    ): Promise<Role> {
        const client = tx || this.prisma;
        const result =  await client.role.create({
            data: data
        })

        await this.invalidateNamespace();
        return result;
    }

    async update(
        id: number,
        data: Partial<Role>,
        tx?: Prisma.TransactionClient
    ): Promise<Role> {
        const client = tx || this.prisma;
        const result = await client.role.update({
            where: {
                id: id
            },
            data: data
        })

        await this.invalidateNamespace();
        return result
    }

    async remove(
        id: number,
        tx?: Prisma.TransactionClient
    ): Promise<Role> {
        const client = tx || this.prisma;
        const result = await client.role.delete({
            where: { id: id }
        })

        await this.invalidateNamespace();
        return result
    }
}
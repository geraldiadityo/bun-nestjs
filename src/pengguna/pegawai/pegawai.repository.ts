import { Injectable, Logger } from "@nestjs/common";
import { CacheRepository } from "../../common/cache.repository";
import { PrismaService } from "../../common/prisma.service";
import { Pegawai, Prisma } from "@prisma/client";

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

        await this.setCacheData(cacheKey, dbData);

        return dbData;
    }
}
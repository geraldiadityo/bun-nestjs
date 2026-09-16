import { Logger ,Injectable, OnApplicationShutdown, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";
import { Pool } from "pg";

@Injectable()
export class PrismaService extends PrismaClient<Prisma.PrismaClientOptions, 'query'> implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown {
    private readonly logger = new Logger('PrismaService')
    private isDisconnected = false;

    constructor() {
        const connectionString = process.env.DATABASE_URL;

        const pool = new Pool({ connectionString })
        
        const adapter = new PrismaPg(pool);
        
        super({
            adapter,
            log: [
                { emit: 'event', level: 'query' }
            ]
        });

        this.$on('query', (e) => {
            const message = `Query: ${e.query} -- Params: ${e.params}`;
            this.logger.debug(`Execute in ${e.duration}ms | ${message}`)
        });
    }

    async onModuleInit() {
        await this.$connect();
        this.logger.log('Connected to Database via Prisma Drive adapter');
    }

    private async closeConnection(phase: string, signal?: string) {
        if (this.isDisconnected) return;

        this.isDisconnected = true;

        this.logger.log(`[${phase}] Recieved shutdown signal ${signal || 'UNKNOW'}. Closgin database connection....`, 'PrismaService');
        try {
            if (signal === 'SIGINT' || signal === 'SIGTERM') {
                await this.$disconnect();
                this.logger.log('Database connection closed immedately for fast exit', 'Prisma Service')
            } else {
                await this.$disconnect()
                this.logger.log('Database connection closed gracefully', 'PrismaService')
            }
        } catch (err){
            if (err instanceof Error) {
                this.logger.error(`Error closing database connection: ${err.message}`, err.stack, 'PrismaService');
            } else {
                this.logger.error('Unknown error occured during shutdown', String(err), 'PrismaService')
            }
        }
    }

    async onModuleDestroy() {
        if (process.env.NODE_ENV !== 'production') {
            await this.closeConnection('on module destroy (Dev mod)')
        }
    }

    async onApplicationShutdown(signal?: string) {
        if (process.env.NODE_ENV !== 'production') {
            await this.closeConnection(`on application shutdown (prod mode) - signal: ${signal}`)
        }
    }
}
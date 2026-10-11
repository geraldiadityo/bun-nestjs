import { Global, Inject, Logger, MiddlewareConsumer, Module, NestModule, OnApplicationShutdown, OnModuleDestroy } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PrismaService } from "./prisma.service";
import { KEYV_INSTACE, KeyvProvider } from "./keyv.provider";
import Keyv from "keyv";
import { RedisClientType } from "@keyv/redis";
import { APP_FILTER } from "@nestjs/core";
import { ErrorFilter } from "../utils/error.filter";
import { JwtModule } from '@nestjs/jwt';
@Global()
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true
        }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                const secret = configService.get<string>('JWT_SECRET_KEY');
                const expiresIn = configService.get<string>('JWT_EXPIRATION_TIME', '30m');
                return {
                    secret: secret,
                    signOptions: {
                        expiresIn: (expiresIn || '15m') as any
                    }
                }
            }
        })
    ],
    providers: [
        PrismaService,
        KeyvProvider,
        {
            provide: APP_FILTER,
            useClass: ErrorFilter
        }
    ],
    exports: [
        PrismaService,
        JwtModule,
        KeyvProvider
    ]
})
export class CommonModule implements NestModule, OnApplicationShutdown, OnModuleDestroy {
    private isRedisDisconnect = false;

    private readonly logger = new Logger('CommonModule');

    constructor(
        @Inject(KEYV_INSTACE) private readonly globalKeyv: Keyv
    ) {}

    private async closeRedisConnection(phase: string, signal?: string) {
        if (this.isRedisDisconnect) return;

        this.isRedisDisconnect = true;

        this.logger.log(`[${phase}] Recieved shutdown signal ${signal}. Closing redis connection...`)
        
        try {
            if(this.globalKeyv){
                const store = this.globalKeyv.opts.store as any;
                const redisClient = (this.globalKeyv as any)._customRedisClient as RedisClientType;

                if(redisClient){
                    if (redisClient.isOpen) {
                        if (signal === 'SIGINT' || signal === 'SIGTERM'){
                            redisClient.destroy();
                            this.logger.log('Redis connection force-close immediately for fast exit');
                        } else {
                            await redisClient.quit();
                            this.logger.log('Redis connection closed gracefully')
                        }
                    } else {
                        this.logger.log('Redis client is not open, skipping close connection');
                    }
                } else {
                    await this.globalKeyv.disconnect();
                    this.logger.log('Keyv disconnect using default method');
                }
            }
        } catch (err: unknown) {
            if (err instanceof Error){
                this.logger.error(`Error closing redis connection: ${err.message}`, err.stack);
            } else {
                this.logger.error(`Error closing redis connection`, String(err));
            }
        }
    }

    async onModuleDestroy() {
        // Fallback jika onApplicationShutdown tidak terpanggil (contoh: di beberapa unit test)
        await this.closeRedisConnection('on module destroy', 'SIGINT');
    }

    async onApplicationShutdown(signal?: string) {
        // app.close() dari main.ts akan men-trigger fungsi ini
        await this.closeRedisConnection('on application shutdown', signal);
    }

    configure(consumer: MiddlewareConsumer) {
        
    }
}
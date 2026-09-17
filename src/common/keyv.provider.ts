import KeyvRedis, { RedisClientType } from '@keyv/redis';
import { Logger, Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Keyv from 'keyv';

export const KEYV_INSTACE = 'KEYV_INSTANCE';

export const KeyvProvider: Provider = {
    provide: KEYV_INSTACE,
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
        const logger = new Logger('KeyvProvider')

        const password = configService.get<string>('REDIS_PASSWORD');
        const host = configService.get<string>('REDIS_HOST');
        const port = configService.get<string>('REDIS_PORT', '6379');
        const ttl = configService.get<number>('CACHE_TTL');

        let redisUri: string;

        if(password){
            redisUri = `redis://:${password}@${host}:${port}`;
        } else {
            redisUri = `redis://${host}:${port}`;
        }

        const keyvRedis = new KeyvRedis(redisUri);

        const redisClient = (keyvRedis as any).client as RedisClientType;


        if (redisClient) {
            redisClient.setMaxListeners(50);

            redisClient.on('error', (err: any) => {
                logger.error(`Redis connection error: ${err.message}`, err.stack);
            })

            redisClient.on('ready', () => {
                logger.log('Redis connected successfully');
            });

            try {
                await redisClient.connect();
            } catch (err: any) {
                logger.error(`Failed to connect to Redis on startup: ${err.message}`, err.stack);
            }
        }

        const keyv = new Keyv({ store: keyvRedis, namespace: 'cache', ttl: ttl });

        (keyv as any)._customRedisClient = redisClient;

        keyv.on('error', (err: any) => {
            logger.error(`Keyv error: ${err.message}`, err.stack);
        });

        return keyv;
    }
}
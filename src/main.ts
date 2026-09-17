import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module';
import { ConfigService } from '@nestjs/config';
import { WinstonLogger } from './common/winston.logger';

async function bootstrap() {
  const customeLogger = new WinstonLogger();
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
    logger: customeLogger
  });
  
  const configService = app.get(ConfigService);
  app.enableShutdownHooks();
  const port = configService.get('PORT', '8000')
  await app.listen(Number(port), '0.0.0.0');
  customeLogger.log(`Backend service running on port ${configService.get('PORT', '8000')}`, 'Bootstrap')
  
  // process.once('SIGINT', async () => {
  //   customeLogger.log('SIGINT diterima, menutup aplikasi dan koneksi...', 'Bootstrap');

  //   const forceExitTimer = setTimeout(() => {
  //     customeLogger.warn('Proses shutdown terlalu lama, memaksa keluar (force exit)...', 'Bootstrap');
  //     process.exit(0);
  //   }, 2000);
  //   try {
  //     const prismaService = app.get(PrismaService);
  //     await prismaService.$disconnect();
  //     customeLogger.log('Database berhasil di putus manual.', 'Bootstrap');
  //   } catch (err: unknown) {
  //     if (err instanceof Error) {
  //       customeLogger.error(`Gagal memutus database: ${err.message}`, err.stack, 'Bootstrap');
  //     } else {
  //       customeLogger.error('Gagal memutus database karena error yang tidak di ketahui', String(err), 'Bootstrap');
  //     }
  //   } finally {
  //     clearTimeout(forceExitTimer);
  //     process.exit(0);
  //   }
  // })
}
void bootstrap();

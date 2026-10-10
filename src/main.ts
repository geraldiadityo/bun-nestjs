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
  
  // Tangkap sinyal untuk cross-platform (Windows, Linux, macOS)
  const shutdownSignals = ['SIGINT', 'SIGTERM'];
  for (const signal of shutdownSignals) {
    process.once(signal, async () => {
      customeLogger.log(`Sinyal ${signal} diterima, memulai graceful shutdown...`, 'Bootstrap');
      
      const forceExitTimer = setTimeout(() => {
        customeLogger.warn('Proses shutdown terlalu lama, memaksa keluar (force exit)...', 'Bootstrap');
        process.exit(1);
      }, 5000);

      try {
        // app.close() akan memanggil onApplicationShutdown dan onModuleDestroy di semua module (termasuk Prisma dan Redis)
        await app.close();
        customeLogger.log('Aplikasi dan koneksi berhasil ditutup dengan aman.', 'Bootstrap');
      } catch (err: unknown) {
        if (err instanceof Error) {
          customeLogger.error(`Gagal melakukan shutdown: ${err.message}`, err.stack, 'Bootstrap');
        } else {
          customeLogger.error('Gagal melakukan shutdown karena error tak terduga', String(err), 'Bootstrap');
        }
      } finally {
        clearTimeout(forceExitTimer);
        // Memberi waktu 100ms agar Winston menyelesaikan proses 'flush' menulis log ke console/file
        setTimeout(() => process.exit(0), 100);
      }
    });
  }
}
void bootstrap();

import { CacheRepository, CacheOptions } from '../common/cache.repository';

/**
 * Interface dasar untuk Prisma Delegate guna memastikan type-safety.
 */
export interface PrismaDelegate {
    findMany: (args?: any) => Promise<any>;
    findUnique: (args: any) => Promise<any>;
    findFirst: (args?: any) => Promise<any>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    count: (args?: any) => Promise<number>;
}

/**
 * BaseRepository
 * 
 * Kelas abstrak ini membungkus operasi CRUD dasar Prisma (delegate) 
 * sekaligus mengintegrasikannya dengan sistem Redis Cache dari CacheRepository.
 */
export abstract class BaseRepository<Delegate extends PrismaDelegate> extends CacheRepository {
    /**
     * @param delegate Contoh: prisma.pegawai
     * @param defaultTtl TTL bawaan (dalam milidetik) jika tidak ditentukan spesifik
     */
    constructor(
        protected readonly delegate: Delegate,
        protected readonly defaultTtl: number = 1000 * 60 * 10 // 10 menit
    ) {
        super();
    }

    /**
     * =========================================
     * READ OPERATIONS (Menggunakan Cache)
     * =========================================
     */

    async findMany(
        args?: Parameters<Delegate['findMany']>[0],
        cacheOptions?: CacheOptions,
        txDelegate?: Delegate
    ): Promise<Awaited<ReturnType<Delegate['findMany']>>> {
        const executor = txDelegate || this.delegate;
        const key = this.getCacheKey({ method: 'findMany', args });
        return this.fetchWithCache(
            key, 
            () => executor.findMany(args), 
            { ttlInMs: this.defaultTtl, ...cacheOptions }
        ) as Promise<Awaited<ReturnType<Delegate['findMany']>>>;
    }

    async findFirst(
        args?: Parameters<Delegate['findFirst']>[0],
        cacheOptions?: CacheOptions,
        txDelegate?: Delegate
    ): Promise<Awaited<ReturnType<Delegate['findFirst']>>> {
        const executor = txDelegate || this.delegate;
        const key = this.getCacheKey({ method: 'findFirst', args });
        return this.fetchWithCache(
            key, 
            () => executor.findFirst(args), 
            { ttlInMs: this.defaultTtl, ...cacheOptions }
        ) as Promise<Awaited<ReturnType<Delegate['findFirst']>>>;
    }

    async findUnique(
        args: Parameters<Delegate['findUnique']>[0],
        cacheOptions?: CacheOptions,
        txDelegate?: Delegate
    ): Promise<Awaited<ReturnType<Delegate['findUnique']>>> {
        const executor = txDelegate || this.delegate;
        const key = this.getCacheKey({ method: 'findUnique', args });
        return this.fetchWithCache(
            key, 
            () => executor.findUnique(args), 
            { ttlInMs: this.defaultTtl, ...cacheOptions }
        ) as Promise<Awaited<ReturnType<Delegate['findUnique']>>>;
    }

    async count(
        args?: Parameters<Delegate['count']>[0],
        cacheOptions?: CacheOptions,
        txDelegate?: Delegate
    ): Promise<Awaited<ReturnType<Delegate['count']>>> {
        const executor = txDelegate || this.delegate;
        const key = this.getCacheKey({ method: 'count', args });
        return this.fetchWithCache(
            key, 
            () => executor.count(args), 
            { ttlInMs: this.defaultTtl, ...cacheOptions }
        ) as Promise<Awaited<ReturnType<Delegate['count']>>>;
    }

    /**
     * =========================================
     * WRITE OPERATIONS (Menghapus Cache)
     * =========================================
     * Semua operasi write (create/update/delete) akan secara otomatis 
     * menghapus seluruh cache di dalam namespace repository ini agar 
     * data yang tampil tidak basi.
     */

    async create(
        args: Parameters<Delegate['create']>[0],
        txDelegate?: Delegate
    ): Promise<Awaited<ReturnType<Delegate['create']>>> {
        const executor = txDelegate || this.delegate;
        const result = await executor.create(args);
        // Data berubah, bersihkan cache namespace ini
        await this.invalidateNamespace();
        return result as Awaited<ReturnType<Delegate['create']>>;
    }

    async update(
        args: Parameters<Delegate['update']>[0],
        txDelegate?: Delegate
    ): Promise<Awaited<ReturnType<Delegate['update']>>> {
        const executor = txDelegate || this.delegate;
        const result = await executor.update(args);
        await this.invalidateNamespace();
        return result as Awaited<ReturnType<Delegate['update']>>;
    }

    async delete(
        args: Parameters<Delegate['delete']>[0],
        txDelegate?: Delegate
    ): Promise<Awaited<ReturnType<Delegate['delete']>>> {
        const executor = txDelegate || this.delegate;
        const result = await executor.delete(args);
        await this.invalidateNamespace();
        return result as Awaited<ReturnType<Delegate['delete']>>;
    }
}

import { Inject, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { KEYV_INSTACE } from "./keyv.provider";
import Keyv from "keyv";

export interface CacheOptions {
    ttlInMs?: number;
    useCache?: boolean; // Jika diisi, akan mengabaikan nilai enableCache
}

export abstract class CacheRepository implements OnModuleInit, OnModuleDestroy {
    @Inject(KEYV_INSTACE) protected keyv!: Keyv;

    protected cache!: Keyv;

    /**
     * Menentukan apakah repository ini menggunakan cache atau tidak secara default.
     * Bisa di-override oleh child class (misalnya: this.enableCache = false).
     */
    protected enableCache: boolean = true;

    protected abstract getNamespace(): string;

    onModuleInit() {
        this.cache = new Keyv({
            store: this.keyv.opts.store,
            namespace: this.getNamespace(),
        })
    }

    onModuleDestroy() {
        if (this.cache) {
            this.cache.removeAllListeners();
        }
    }

    protected async setCacheData(
        key: string,
        value: any,
        ttlInMs?: number
    ): Promise<void> {
        await this.cache.set(key, value, ttlInMs);
    }

    protected async invalidateNamespace(): Promise<void> {
        await this.cache.clear();
    }

    protected getCacheKey(args: any): string {
        return JSON.stringify(args || {})
    }

    /**
     * Fungsi wrapper untuk menangani logika pengecekan cache dan pengambilan data.
     */
    protected async fetchWithCache<T>(
        key: string,
        fetchDatabaseCallback: () => Promise<T>,
        options?: CacheOptions
    ): Promise<T> {
        // Tentukan status penggunaan cache (prioritas: opsi parameter > global flag class)
        const useCache = options?.useCache !== undefined ? options.useCache : this.enableCache;

        // Bypass cache jika statusnya false
        if (!useCache) {
            return await fetchDatabaseCallback();
        }

        // Cek data di dalam cache
        const cachedData = await this.cache.get<T>(key);
        if (cachedData) {
            return cachedData;
        }

        // Ambil dari database jika cache kosong
        const data = await fetchDatabaseCallback();

        // Simpan hasil ke cache, jika hasilnya valid (tidak undefined / null)
        if (data !== undefined && data !== null) {
            await this.setCacheData(key, data, options?.ttlInMs);
        }

        return data;
    }
}
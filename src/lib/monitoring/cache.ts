import { performanceMonitor } from "./performance";
import { logger } from "./logger";

interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  ttl: number; // Time to live in milliseconds
}

class QueryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private static instance: QueryCache;
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutos

  static getInstance(): QueryCache {
    if (!QueryCache.instance) {
      QueryCache.instance = new QueryCache();
    }
    return QueryCache.instance;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: new Date(),
      ttl: ttl || this.defaultTTL,
    };

    this.cache.set(key, entry);
    logger.debug(`Cache SET: ${key}`, { ttl: entry.ttl });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // Verificar si ha expirado
    const now = new Date();
    const age = now.getTime() - entry.timestamp.getTime();

    if (age > entry.ttl) {
      this.cache.delete(key);
      logger.debug(`Cache EXPIRED: ${key}`, { age, ttl: entry.ttl });
      return null;
    }

    logger.debug(`Cache HIT: ${key}`, { age, ttl: entry.ttl });
    return entry.data;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug(`Cache DELETE: ${key}`);
    }
    return deleted;
  }

  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.debug(`Cache CLEAR: ${size} entries removed`);
  }

  // Limpiar entradas expiradas
  cleanup(): void {
    const now = new Date();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      const age = now.getTime() - entry.timestamp.getTime();
      if (age > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cache CLEANUP: ${cleaned} expired entries removed`);
    }
  }

  getStats(): {
    size: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const queryCache = QueryCache.getInstance();

// Wrapper para funciones con cache
export function withCache<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl?: number
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);

    // Intentar obtener del cache
    const cached = queryCache.get(key);
    if (cached !== null) {
      return cached;
    }

    // Ejecutar función y cachear resultado
    const endTimer = performanceMonitor.startTimer(`query:${key}`);

    try {
      const result = await fn(...args);
      queryCache.set(key, result, ttl);
      endTimer();
      return result;
    } catch (error) {
      endTimer();
      throw error;
    }
  }) as T;
}

// Generadores de keys comunes
export const cacheKeys = {
  memberDues: (memberId: string) => `member:${memberId}:dues`,
  memberStats: (memberId: string) => `member:${memberId}:stats`,
  enrollmentList: (page: number, filters: Record<string, unknown>) =>
    `enrollments:page:${page}:filters:${JSON.stringify(filters)}`,
  dueList: (enrollmentId: string, status?: string) =>
    `dues:${enrollmentId}${status ? `:status:${status}` : ""}`,
};

// Limpiar cache periódicamente
setInterval(() => {
  queryCache.cleanup();
}, 60 * 1000); // Cada minuto

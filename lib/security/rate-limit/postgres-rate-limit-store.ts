import { Prisma, type PrismaClient } from "@prisma/client";

import type { RateLimitConsumeInput, RateLimitConsumeResult, RateLimitResetKey, RateLimitStore } from "./rate-limit-types";
import { RateLimitStorageUnavailableError } from "./rate-limit-types";

interface PostgresRateLimitStoreOptions {
  cleanupEvery?: number;
  cleanupBatchSize?: number;
}

export class PostgresRateLimitStore implements RateLimitStore {
  private consumeCount = 0;
  private readonly cleanupEvery: number;
  private readonly cleanupBatchSize: number;

  constructor(private readonly client: PrismaClient, options: PostgresRateLimitStoreOptions = {}) {
    this.cleanupEvery = options.cleanupEvery ?? 100;
    this.cleanupBatchSize = options.cleanupBatchSize ?? 100;
    if (!Number.isSafeInteger(this.cleanupEvery) || this.cleanupEvery <= 0) throw new TypeError("cleanupEvery must be positive");
    if (!Number.isSafeInteger(this.cleanupBatchSize) || this.cleanupBatchSize <= 0) throw new TypeError("cleanupBatchSize must be positive");
  }

  async consume(input: RateLimitConsumeInput): Promise<RateLimitConsumeResult> {
    try {
      // Prisma has no single high-level operation that both increments conditionally
      // and returns whether this attempt consumed capacity. Parameterized SQL keeps
      // that decision atomic inside PostgreSQL under concurrent contention.
      const rows = await this.client.$queryRaw<Array<{ count: number }>>(Prisma.sql`
        INSERT INTO "RateLimitBucket" ("scope", "keyDigest", "windowStart", "expiresAt", "count", "createdAt", "updatedAt")
        VALUES (${input.scope}, ${input.keyDigest}, ${input.windowStart}, ${input.expiresAt}, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT ("scope", "keyDigest", "windowStart") DO UPDATE
        SET "count" = "RateLimitBucket"."count" + 1,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "RateLimitBucket"."count" < ${input.limit}
        RETURNING "count"
      `);

      this.consumeCount += 1;
      if (this.consumeCount % this.cleanupEvery === 0) {
        await this.cleanupExpired(input.windowStart).catch(() => undefined);
      }

      const row = rows[0];
      return row ? { consumed: true, count: row.count } : { consumed: false, count: input.limit };
    } catch (error) {
      if (isStorageUnavailable(error)) throw new RateLimitStorageUnavailableError({ cause: error });
      throw error;
    }
  }

  async cleanupExpired(now: Date, batchSize = this.cleanupBatchSize): Promise<number> {
    if (!Number.isSafeInteger(batchSize) || batchSize <= 0) throw new TypeError("batchSize must be positive");
    try {
      return await this.client.$executeRaw(Prisma.sql`
        DELETE FROM "RateLimitBucket"
        WHERE ctid IN (
          SELECT ctid FROM "RateLimitBucket"
          WHERE "expiresAt" <= ${now}
          ORDER BY "expiresAt"
          LIMIT ${batchSize}
        )
      `);
    } catch (error) {
      if (isStorageUnavailable(error)) throw new RateLimitStorageUnavailableError({ cause: error });
      throw error;
    }
  }

  async reset(keys: RateLimitResetKey[]): Promise<number> {
    if (keys.length === 0) return 0;
    try {
      const result = await this.client.rateLimitBucket.deleteMany({
        where: { OR: keys.map(({ scope, keyDigest }) => ({ scope, keyDigest })) },
      });
      return result.count;
    } catch (error) {
      if (isStorageUnavailable(error)) throw new RateLimitStorageUnavailableError({ cause: error });
      throw error;
    }
  }
}

function isStorageUnavailable(error: unknown): boolean {
  const unavailableCodes = new Set(["P1001", "P1002", "P1008", "P1017", "P2024"]);
  if (error instanceof Prisma.PrismaClientInitializationError) {
    if (error.errorCode !== undefined) return unavailableCodes.has(error.errorCode);
    // Prisma 5 can omit P1001 from errorCode. Match only its stable connection
    // failure text; other initialization/configuration errors still propagate.
    return error.message.includes("Can't reach database server");
  }
  return error instanceof Prisma.PrismaClientKnownRequestError && unavailableCodes.has(error.code);
}

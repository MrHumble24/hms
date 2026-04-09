import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    super({
      adapter,
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });

    // NOTE: Prisma 5+ removed the $use() middleware API.
    // Soft delete logic should be implemented at the service layer
    // by adding `deletedAt: null` to queries and using `update` instead of `delete`.
  }

  async onModuleInit() {
    await this.$connect();
  }
}

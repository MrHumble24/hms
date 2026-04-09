import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const featured = await prisma.branch.findMany({
    where: { isFeatured: true },
    take: 10,
    select: { name: true, isFeatured: true, address: true },
  });
  console.log('Featured (Trending) Hotels:');
  console.table(featured);
}

main().finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});

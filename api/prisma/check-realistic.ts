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
  const branches = await prisma.branch.findMany({
    take: 5,
    select: {
      name: true,
      address: true,
      starRating: true,
      latitude: true,
      longitude: true,
    },
  });
  console.log('Sample Realistic Branches:');
  console.table(branches);
}

main().finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});

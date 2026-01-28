import { PrismaClient, ServiceCategory, Currency } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const branch = await prisma.branch.findFirst();
  if (!branch) {
    console.log('No branch found to seed services.');
    return;
  }

  const services = [
    {
      name: 'Airport Pickup (Standard)',
      description: 'Standard sedan pickup from Tashkent Airport',
      category: ServiceCategory.TRANSPORT,
      basePrice: 200000,
      currency: Currency.UZS,
    },
    {
      name: 'Laundry (Wash & Fold)',
      description: 'Same-day laundry service',
      category: ServiceCategory.LAUNDRY,
      basePrice: 50000,
      currency: Currency.UZS,
    },
    {
      name: 'Express Dry Cleaning',
      description: 'Urgent dry cleaning for suits and dresses',
      category: ServiceCategory.LAUNDRY,
      basePrice: 150000,
      currency: Currency.UZS,
    },
    {
      name: 'Thai Massage (60 min)',
      description: 'Professional relaxation massage',
      category: ServiceCategory.SPA,
      basePrice: 450000,
      currency: Currency.UZS,
    },
    {
      name: 'City Tour (Private)',
      description: '4-hour private tour around historical sites',
      category: ServiceCategory.CONCIERGE,
      basePrice: 800000,
      currency: Currency.UZS,
    },
  ];

  for (const s of services) {
    await (prisma as any).hotelService.create({
      data: {
        ...s,
        tenantId: branch.tenantId,
        branchId: branch.id,
      },
    });
  }

  console.log('Seed services created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

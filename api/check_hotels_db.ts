import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkHotels() {
  console.log(
    'Using DATABASE_URL:',
    process.env.DATABASE_URL?.split('@')[1] || 'NOT SET',
  );

  const trending = await prisma.branch.findMany({
    where: {
      isActive: true,
      isFeatured: true,
      tenant: { isActive: true },
    },
    include: {
      tenant: true,
      roomTypes: true,
    },
  });

  console.log('Trending Hotels Count:', trending.length);
  trending.forEach((h) => {
    console.log(
      `- ${h.name} (ID: ${h.id}, Tenant: ${h.tenant.name}, RoomTypes: ${h.roomTypes.length}, Lat: ${h.latitude}, Lng: ${h.longitude})`,
    );
  });

  const totalActive = await prisma.branch.count({
    where: { isActive: true, tenant: { isActive: true } },
  });
  console.log('Total Active Branches:', totalActive);

  if (trending.length === 0) {
    console.log('\nChecking why trending is empty:');
    const featuredCount = await prisma.branch.count({
      where: { isFeatured: true },
    });
    console.log('Total Branches with isFeatured=true:', featuredCount);

    const activeCount = await prisma.branch.count({
      where: { isActive: true },
    });
    console.log('Total Branches with isActive=true:', activeCount);

    const activeTenants = await prisma.tenant.count({
      where: { isActive: true },
    });
    console.log('Total Tenants with isActive=true:', activeTenants);
  }
}

checkHotels()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());

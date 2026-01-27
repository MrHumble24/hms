import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(
    '🔍 DATABASE_URL:',
    process.env.DATABASE_URL ? 'FOUND' : 'MISSING',
  );
  console.log('🚀 Starting Multi-Tenant data patch...');

  // 1. Create Default Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Main Organization',
      slug: 'default',
    },
  });
  console.log(`✅ Tenant created/found: ${tenant.name} (${tenant.id})`);

  // 2. Create Default Branch
  const branch = await prisma.branch.upsert({
    where: { id: 'default-branch-id' },
    update: {},
    create: {
      id: 'default-branch-id',
      name: 'Main Branch',
      tenantId: tenant.id,
    },
  });
  console.log(`✅ Branch created/found: ${branch.name} (${branch.id})`);

  // 3. Patch Tenant-scoped models
  console.log('📦 Patching Tenant-scoped models...');
  await prisma.user.updateMany({
    where: { tenantId: null } as any,
    data: { tenantId: tenant.id },
  });
  await prisma.guest.updateMany({
    where: { tenantId: null } as any,
    data: { tenantId: tenant.id },
  });
  await prisma.company.updateMany({
    where: { tenantId: null } as any,
    data: { tenantId: tenant.id },
  });

  // 4. Assign all users to the default branch
  console.log('🔗 Connecting users to default branch...');
  const users = await prisma.user.findMany();
  for (const user of users) {
    await prisma.userBranch.upsert({
      where: {
        userId_branchId: {
          userId: user.id,
          branchId: branch.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        branchId: branch.id,
      },
    });
  }

  // 5. Patch Branch-scoped models
  console.log('📦 Patching Branch-scoped models...');

  const branchModels = [
    'room',
    'roomType',
    'booking',
    'inventoryItem',
    'restaurantCategory',
    'restaurantMenuItem',
    'restaurantOrder',
    'folio',
  ];

  for (const model of branchModels) {
    // @ts-ignore - dynamic access for patching
    await prisma[model].updateMany({
      where: { branchId: null },
      data: { branchId: branch.id },
    });
  }

  console.log('✨ Data patch complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during data patch:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

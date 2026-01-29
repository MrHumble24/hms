import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting backfill of Guest branchId...');

  const tenants = await prisma.tenant.findMany({
    include: { branches: { take: 1 } },
  });

  for (const tenant of tenants) {
    const defaultBranchId = tenant.branches[0]?.id;
    if (!defaultBranchId) {
      console.log(`⚠️ Tenant ${tenant.id} has no branches, skipping...`);
      continue;
    }

    console.log(
      `🔗 Backfilling guests for Tenant: ${tenant.id} with Branch: ${defaultBranchId}`,
    );

    const result = await (prisma.guest as any).updateMany({
      where: {
        tenantId: tenant.id,
        branchId: null,
      },
      data: {
        branchId: defaultBranchId,
      },
    });

    console.log(`✅ Updated ${result.count} guests for tenant ${tenant.id}`);
  }

  console.log('✨ Backfill complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not Set');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting users seed...');

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash('password123', salt);

  const existingAdmin = await prisma.user.findFirst({
    where: { email: 'super@hms.uz' },
  });

  if (existingAdmin) {
    console.log('⚠️ Super admin already exists, skipping...');
    return;
  }

  let systemTenant = await prisma.tenant.findFirst({
    where: { slug: 'system' },
  });

  if (!systemTenant) {
    systemTenant = await prisma.tenant.create({
      data: {
        name: 'System',
        slug: 'system',
        isActive: true,
        subscriptionStatus: 'ACTIVE',
        planType: 'ENTERPRISE',
        maxBranches: 999,
        maxUsers: 999,
      },
    });
    console.log('✅ System tenant created');
  }

  const admin = await prisma.user.create({
    data: {
      email: 'super@hms.uz',
      password: hashedPassword,
      fullName: 'Super Admin',
      role: Role.SUPER_ADMIN,
      tenant: {
        connect: { id: systemTenant.id },
      },
    },
  });

  console.log(`✅ Super Admin created: ${admin.email}`);
  console.log('✅ Users seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding users:');
    console.error(JSON.stringify(e, null, 2));
    if (e.cause) console.error('Cause:', JSON.stringify(e.cause, null, 2));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

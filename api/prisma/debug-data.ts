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
  const tenantId = '896c9429-5c26-41bc-9d3b-cdbed5d54ea6';

  console.log('--- Branches for Tenant ---');
  const branches = await prisma.branch.findMany({ where: { tenantId } });
  console.table(branches.map((b) => ({ id: b.id, name: b.name })));

  console.log('--- Bookings for Tenant ---');
  const bookings = await prisma.booking.findMany({
    where: { tenantId },
    include: { primaryGuest: true, roomStays: { include: { room: true } } },
  });
  console.log(`Found ${bookings.length} bookings`);
  if (bookings.length > 0) {
    console.table(
      bookings.map((b) => ({
        id: b.id,
        branchId: b.branchId,
        guest: b.primaryGuest
          ? `${b.primaryGuest.firstName} ${b.primaryGuest.lastName}`
          : 'NULL',
        room: b.roomStays?.[0]?.room?.number || 'NONE',
      })),
    );
  }

  console.log('--- Guests for Tenant ---');
  const guests = await prisma.guest.findMany({ where: { tenantId } });
  console.table(
    guests.map((g) => ({ id: g.id, name: `${g.firstName} ${g.lastName}` })),
  );
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

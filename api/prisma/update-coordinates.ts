/**
 * Script to update all Branch records with random Tashkent coordinates.
 *
 * Tashkent bounding box (approximate):
 * - Latitude: 41.20 to 41.40
 * - Longitude: 69.10 to 69.40
 *
 * Usage: pnpm ts-node prisma/update-coordinates.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not Set');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Tashkent bounding box
const TASHKENT_BOUNDS = {
  minLat: 41.2,
  maxLat: 41.4,
  minLng: 69.1,
  maxLng: 69.4,
};

/**
 * Generate a random coordinate within Tashkent bounds
 */
function randomTashkentCoordinate(): { latitude: number; longitude: number } {
  const latitude =
    TASHKENT_BOUNDS.minLat +
    Math.random() * (TASHKENT_BOUNDS.maxLat - TASHKENT_BOUNDS.minLat);
  const longitude =
    TASHKENT_BOUNDS.minLng +
    Math.random() * (TASHKENT_BOUNDS.maxLng - TASHKENT_BOUNDS.minLng);

  // Round to 6 decimal places for precision
  return {
    latitude: Math.round(latitude * 1000000) / 1000000,
    longitude: Math.round(longitude * 1000000) / 1000000,
  };
}

async function main() {
  console.log('🗺️  Starting coordinate update for all branches...');

  // Fetch all branches
  const branches = await prisma.branch.findMany({
    select: { id: true, name: true, latitude: true, longitude: true },
  });

  console.log(`📍 Found ${branches.length} branches to update`);

  let updated = 0;
  let skipped = 0;

  for (const branch of branches) {
    const { latitude, longitude } = randomTashkentCoordinate();

    await prisma.branch.update({
      where: { id: branch.id },
      data: { latitude, longitude },
    });

    updated++;
    process.stdout.write(
      `\r⏳ Updated ${updated}/${branches.length} branches...`,
    );
  }

  console.log(`\n\n✅ Coordinate update complete!`);
  console.log(`   - Updated: ${updated} branches`);
  console.log(`   - All branches now have Tashkent coordinates`);
  console.log(
    `   - Latitude range: ${TASHKENT_BOUNDS.minLat} to ${TASHKENT_BOUNDS.maxLat}`,
  );
  console.log(
    `   - Longitude range: ${TASHKENT_BOUNDS.minLng} to ${TASHKENT_BOUNDS.maxLng}`,
  );
}

main()
  .catch((e) => {
    console.error('❌ Error updating coordinates:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

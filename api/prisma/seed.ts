import {
  PrismaClient,
  RoomStatus,
  Role,
  Gender,
  BookingStatus,
  BookingSource,
  TaskStatus,
  Priority,
  TicketStatus,
  FolioStatus,
} from '@prisma/client';
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
  console.log('🌱 Starting seed...');

  // Clear existing data to prevent unique constraints
  // Clear existing data to prevent unique constraints
  await prisma.payment.deleteMany();
  await prisma.folioItem.deleteMany();
  await prisma.folio.deleteMany();

  await prisma.emehmonLog.deleteMany();
  await prisma.restaurantOrderItem.deleteMany();
  await prisma.restaurantOrder.deleteMany();

  await prisma.booking.deleteMany();

  await prisma.discountContract.deleteMany();
  await prisma.company.deleteMany();

  await prisma.stockLog.deleteMany();
  await prisma.menuItemIngredient.deleteMany();
  await prisma.inventoryItem.deleteMany();

  await prisma.restaurantMenuItem.deleteMany();
  await prisma.restaurantCategory.deleteMany();

  await prisma.roomStatusHistory.deleteMany();
  await prisma.maintenanceTicket.deleteMany();
  await prisma.housekeepingTask.deleteMany();
  await prisma.room.deleteMany();

  await prisma.priceModifier.deleteMany();
  await prisma.roomType.deleteMany();

  await prisma.guest.deleteMany();
  await prisma.userBranch.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.tenant.deleteMany();

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash('admin123', salt);

  // 0. Create Tenant & Branch
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Main Organization',
      slug: 'default',
    },
  });

  const branch = await prisma.branch.create({
    data: {
      name: 'Main Hotel',
      tenantId: tenant.id,
    },
  });

  console.log(`✅ Tenant & Branch created: ${tenant.id} / ${branch.id}`);

  // 1. Create Staff
  const admin = await prisma.user.create({
    data: {
      email: 'admin@hms.uz',
      password: hashedPassword,
      fullName: 'Super Admin',
      role: Role.SUPER_ADMIN,
      tenantId: tenant.id,
      branches: {
        create: { branchId: branch.id },
      },
    },
  });

  const receptionist = await prisma.user.create({
    data: {
      email: 'rec@hms.uz',
      password: hashedPassword,
      fullName: 'Malika Karimova',
      role: Role.RECEPTIONIST,
      tenantId: tenant.id,
      branches: {
        create: { branchId: branch.id },
      },
    },
  });

  const housekeeper = await prisma.user.create({
    data: {
      email: 'house@hms.uz',
      password: hashedPassword,
      fullName: 'Dilbar Opa',
      role: Role.HOUSEKEEPER,
      tenantId: tenant.id,
      branches: {
        create: { branchId: branch.id },
      },
    },
  });

  // 2. Create Room Types
  const standard = await prisma.roomType.create({
    data: {
      name: 'Standard Twin',
      basePrice: 450000,
      description: 'Comfortable room with two single beds.',
      amenities: ['WiFi', 'TV', 'AC', 'Mini-bar'],
      branchId: branch.id,
      tenantId: tenant.id,
    },
  });

  const deluxe = await prisma.roomType.create({
    data: {
      name: 'Deluxe Queen',
      basePrice: 650000,
      description: 'Spacious room with a queen-size bed and city view.',
      amenities: ['WiFi', 'TV', 'AC', 'Mini-bar', 'Bathrobe'],
      branchId: branch.id,
      tenantId: tenant.id,
    },
  });

  const suite = await prisma.roomType.create({
    data: {
      name: 'Business Suite',
      basePrice: 1200000,
      description: 'Luxury suite with separate living area.',
      amenities: ['WiFi', 'TV', 'AC', 'Mini-bar', 'Coffee Machine', 'Safe'],
      branchId: branch.id,
      tenantId: tenant.id,
    },
  });

  // 3. Create Rooms (20 rooms)
  const rooms: any[] = [];
  for (let floor = 1; floor <= 4; floor++) {
    for (let r = 1; r <= 5; r++) {
      const roomNumber = `${floor}0${r}`;
      let typeId = standard.id;
      if (r === 4) typeId = deluxe.id;
      if (r === 5) typeId = suite.id;

      let status: RoomStatus = RoomStatus.CLEAN;

      // Add variety
      if (floor === 1 && r === 2) status = RoomStatus.DIRTY;
      if (floor === 2 && r === 3) status = RoomStatus.INSPECTED;
      if (floor === 3 && r === 1) status = RoomStatus.DIRTY;
      if (floor === 4 && r === 3) status = RoomStatus.MAINTENANCE;

      const room = await prisma.room.create({
        data: {
          number: roomNumber,
          floor: floor,
          capacity: r === 1 ? 1 : 2,
          status: status,
          typeId: typeId,
          branchId: branch.id,
          tenantId: tenant.id,
        },
      });
      rooms.push(room);

      if (status !== RoomStatus.CLEAN) {
        await prisma.roomStatusHistory.create({
          data: {
            roomId: room.id,
            tenantId: tenant.id,
            oldStatus: RoomStatus.CLEAN,
            newStatus: status,
            userId: housekeeper.id,
            notes: 'Routine check',
          },
        });
      }
    }
  }

  // 4. Create Active Guests & Bookings
  const guest1 = await prisma.guest.create({
    data: {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+998901234567',
      citizenship: 'USA',
      passportSeries: 'AA',
      passportNumber: '1111111',
      dateOfBirth: new Date('1990-01-01'),
      gender: Gender.MALE,
      tenantId: tenant.id,
    },
  });

  const guest2 = await prisma.guest.create({
    data: {
      firstName: 'Azamat',
      lastName: 'Tashatov',
      phone: '+998912345678',
      citizenship: 'UZB',
      passportSeries: 'KA',
      passportNumber: '2222222',
      dateOfBirth: new Date('1985-05-15'),
      gender: Gender.MALE,
      tenantId: tenant.id,
    },
  });

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // const b1 = await prisma.booking.create({
  //   data: {
  //     checkIn: now,
  //     checkOut: tomorrow,
  //     status: BookingStatus.CHECKED_IN,
  //     source: BookingSource.BOOKING_COM,
  //     guestId: guest1.id,
  //     roomId: rooms[0].id,
  //     branchId: branch.id,
  //     tenantId: tenant.id,
  //   },
  // });

  // await prisma.folio.create({
  //   data: {
  //     bookingId: b1.id,
  //     status: FolioStatus.OPEN,
  //     isPrimary: true,
  //     branchId: branch.id,
  //     tenantId: tenant.id,
  //   },
  // });

  // const b2 = await prisma.booking.create({
  //   data: {
  //     checkIn: now,
  //     checkOut: tomorrow,
  //     status: BookingStatus.CHECKED_IN,
  //     source: BookingSource.WALK_IN,
  //     guestId: guest2.id,
  //     roomId: rooms[5].id,
  //     branchId: branch.id,
  //   },
  // });

  // await prisma.folio.create({
  // data: {
  //   bookingId: b2.id,
  //   status: FolioStatus.OPEN,
  //   isPrimary: true,
  //   branchId: branch.id,
  // },
  // });

  // 5. Create some Tasks
  await prisma.housekeepingTask.create({
    data: {
      roomId: rooms[1].id,
      status: TaskStatus.PENDING,
      priority: Priority.HIGH,
      assigneeId: housekeeper.id,
      createdById: admin.id,
      tenantId: tenant.id,
      notes: 'Guest requested extra towels',
    },
  });

  await prisma.housekeepingTask.create({
    data: {
      roomId: rooms[10].id,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      assigneeId: housekeeper.id,
      createdById: admin.id,
      tenantId: tenant.id,
    },
  });

  // 6. Create some Maintenance
  await prisma.maintenanceTicket.create({
    data: {
      roomId: rooms[17].id,
      tenantId: tenant.id,
      description: 'AC leak in 403',
      reportedBy: receptionist.id,
      status: TicketStatus.OPEN,
    },
  });

  // 7. Restaurant Seed Data
  const breakfast = await prisma.restaurantCategory.create({
    data: {
      name: { en: 'Breakfast', uz: 'Nonushta', ru: 'Завтрак' },
      branchId: branch.id,
      tenantId: tenant.id,
    },
  });

  const mainCourses = await prisma.restaurantCategory.create({
    data: {
      name: { en: 'Main Courses', uz: 'Asosiy taomlar', ru: 'Основные блюда' },
      branchId: branch.id,
      tenantId: tenant.id,
    },
  });

  await prisma.restaurantMenuItem.create({
    data: {
      categoryId: breakfast.id,
      tenantId: tenant.id,
      name: {
        en: 'English Breakfast',
        uz: 'Ingliz nonushtasi',
        ru: 'Английский завтрак',
      },
      description: {
        en: 'Eggs, beans, sausage, and toast',
        uz: 'Tuxum, loviya, sosiska va non',
        ru: 'Яйца, бобы, колбаса и тост',
      },
      price: 45000,
      calories: 850,
      ingredients: 'Eggs, canned beans, beef sausage, white bread, butter',
      branchId: branch.id,
    },
  });

  await prisma.restaurantMenuItem.create({
    data: {
      categoryId: mainCourses.id,
      tenantId: tenant.id,
      name: {
        en: 'Beef Steak',
        uz: "Mol go'shti steyki",
        ru: 'Стейк из говядины',
      },
      description: {
        en: 'Grilled beef with mashed potatoes',
        uz: "Piru go'shti va pyure",
        ru: 'Говядина на гриле с картофельным пюре',
      },
      price: 125000,
      calories: 650,
      ingredients: 'Beef tenderloin, potatoes, butter, rosemary, garlic',
      branchId: branch.id,
    },
  });

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:');
    console.error(JSON.stringify(e, null, 2));
    if (e.cause) console.error('Cause:', JSON.stringify(e.cause, null, 2));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

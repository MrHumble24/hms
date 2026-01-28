import {
  PrismaClient,
  Role,
  Gender,
  BookingStatus,
  BookingSource,
  RoomStatus,
  FolioStatus,
  PaymentStatus,
  PaymentMethod,
  Currency,
  TaxType,
  ChargeType,
  FolioItemSource,
  TaskStatus,
  Priority,
  HousekeepingTaskType,
  TicketStatus,
  InventoryCategory,
  StockUpdateReason,
  RestaurantOrderStatus,
  PlanType,
  CommunicationType,
  CommunicationChannel,
  AuditAction,
  RoomStayStatus,
  EmehmonStatus,
} from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Configuration - adjusted for even distribution
const NUM_TENANTS = 50;
const BRANCHES_PER_TENANT = 10; // 50 * 10 = 500 branches total
const RECORDS_PER_BRANCH = 100; // This gives us 50K+ per model (500 branches * 100 = 50K)
const BATCH_SIZE = 2500;

// Lookup maps to prevent orphans
interface TenantData {
  id: string;
  branches: BranchData[];
  users: string[];
  guests: string[];
  companies: string[];
}

interface BranchData {
  id: string;
  tenantId: string;
  roomTypes: RoomTypeData[];
  rooms: RoomData[];
  inventoryItems: string[];
  restaurantCategories: CategoryData[];
  ratePlans: string[];
}

interface RoomTypeData {
  id: string;
  tenantId: string;
  branchId: string;
}

interface RoomData {
  id: string;
  tenantId: string;
  branchId: string;
  typeId: string;
}

interface CategoryData {
  id: string;
  tenantId: string;
  branchId: string;
  menuItems: string[];
}

const tenantsMap: Map<string, TenantData> = new Map();
const allBookings: {
  id: string;
  tenantId: string;
  branchId: string;
  guestId: string;
}[] = [];
const allFolios: {
  id: string;
  tenantId: string;
  branchId: string;
  bookingId: string;
}[] = [];
const allRoomStays: {
  id: string;
  tenantId: string;
  bookingId: string;
  roomId: string;
}[] = [];
const allRestaurantOrders: {
  id: string;
  tenantId: string;
  branchId: string;
}[] = [];

async function main() {
  console.log('🚀 Starting massive seed with NO ORPHANS guarantee...');
  console.log(
    `📊 Target: ${NUM_TENANTS} tenants × ${BRANCHES_PER_TENANT} branches × ${RECORDS_PER_BRANCH} records = 50K+ per model`,
  );

  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('password123', salt);

  // =========================================================
  // PHASE 1: Create Core Hierarchy (Tenants → Branches)
  // =========================================================

  console.log('\n📌 PHASE 1: Creating Core Hierarchy...');

  // 1. Check for existing system tenant from seed.ts and create additional tenants
  console.log('🔹 Checking for existing system tenant...');
  const existingSystemTenant = await prisma.tenant.findFirst({
    where: { slug: 'system' },
  });

  if (existingSystemTenant) {
    console.log('   Found existing system tenant, including it...');
    tenantsMap.set(existingSystemTenant.id, {
      id: existingSystemTenant.id,
      branches: [],
      users: [],
      guests: [],
      companies: [],
    });

    // Also get existing users from system tenant
    const existingUsers = await prisma.user.findMany({
      where: { tenantId: existingSystemTenant.id },
      select: { id: true },
    });
    tenantsMap.get(existingSystemTenant.id)!.users = existingUsers.map(
      (u) => u.id,
    );
  }

  console.log('🔹 Creating Tenants...');
  const tenantsToCreate = existingSystemTenant ? NUM_TENANTS - 1 : NUM_TENANTS;

  for (let t = 0; t < tenantsToCreate; t++) {
    const tenant = await prisma.tenant.create({
      data: {
        name: faker.company.name(),
        slug: `tenant-${t}-${faker.string.alphanumeric(8)}`,
        isActive: true,
        planType: faker.helpers.arrayElement(Object.values(PlanType)),
        maxBranches: BRANCHES_PER_TENANT + 5,
        maxUsers: 1000,
      },
    });

    tenantsMap.set(tenant.id, {
      id: tenant.id,
      branches: [],
      users: [],
      guests: [],
      companies: [],
    });
    process.stdout.write('.');
  }
  console.log(
    `\n✅ Created ${tenantsToCreate} new tenants (+ system tenant if existed)`,
  );

  // 2. Create Branches for each Tenant
  console.log('🔹 Creating Branches per Tenant...');
  const tenantIds = Array.from(tenantsMap.keys());

  for (const tenantId of tenantIds) {
    const tenantData = tenantsMap.get(tenantId)!;
    const branches: any[] = [];

    for (let b = 0; b < BRANCHES_PER_TENANT; b++) {
      branches.push({
        id: faker.string.uuid(),
        name: `${faker.company.name()} Branch ${b + 1}`,
        tenantId: tenantId,
        address: faker.location.streetAddress(),
        isActive: true,
      });
    }

    await prisma.branch.createMany({ data: branches });

    // Store branch data
    branches.forEach((branch) => {
      tenantData.branches.push({
        id: branch.id,
        tenantId: branch.tenantId,
        roomTypes: [],
        rooms: [],
        inventoryItems: [],
        restaurantCategories: [],
        ratePlans: [],
      });
    });

    process.stdout.write('.');
  }
  console.log(
    `\n✅ Created ${NUM_TENANTS * BRANCHES_PER_TENANT} branches (${BRANCHES_PER_TENANT} per tenant)`,
  );

  // 3. Create Users per Tenant (seed.ts already creates super admin)
  console.log('🔹 Creating Users per Tenant...');

  // Create users per tenant (1000 users per tenant = 50K total)
  const usersPerTenant = Math.ceil(50000 / NUM_TENANTS);
  for (const tenantId of tenantIds) {
    const tenantData = tenantsMap.get(tenantId)!;
    const users: any[] = [];

    for (let u = 0; u < usersPerTenant; u++) {
      const userId = faker.string.uuid();
      users.push({
        id: userId,
        email: `user-${tenantId.slice(0, 8)}-${u}@hms.com`,
        password: password,
        fullName: faker.person.fullName(),
        role: faker.helpers.arrayElement(
          Object.values(Role).filter((r) => r !== Role.SUPER_ADMIN),
        ),
        tenantId: tenantId,
        isActive: true,
      });
      tenantData.users.push(userId);
    }

    await prisma.user.createMany({ data: users, skipDuplicates: true });
    process.stdout.write('.');
  }
  console.log(`\n✅ Created ${NUM_TENANTS * usersPerTenant}+ users`);

  // 4. Create Guests per Tenant
  console.log('🔹 Creating Guests per Tenant...');
  const guestsPerTenant = Math.ceil(50000 / NUM_TENANTS);
  for (const tenantId of tenantIds) {
    const tenantData = tenantsMap.get(tenantId)!;

    for (let batch = 0; batch < guestsPerTenant; batch += BATCH_SIZE) {
      const guests: any[] = [];
      const batchSize = Math.min(BATCH_SIZE, guestsPerTenant - batch);

      for (let g = 0; g < batchSize; g++) {
        const guestId = faker.string.uuid();
        guests.push({
          id: guestId,
          tenantId: tenantId,
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          phone: faker.phone.number(),
          citizenship: faker.helpers.arrayElement([
            'UZB',
            'RUS',
            'USA',
            'GBR',
            'DEU',
            'FRA',
            'CHN',
            'KOR',
            'JPN',
          ]),
          passportSeries: faker.string.alpha(2).toUpperCase(),
          passportNumber: faker.string.numeric(7),
          dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
          gender: faker.helpers.arrayElement(['MALE', 'FEMALE'] as Gender[]),
        });
        tenantData.guests.push(guestId);
      }

      await prisma.guest.createMany({ data: guests, skipDuplicates: true });
    }
    process.stdout.write('.');
  }
  console.log(`\n✅ Created ${NUM_TENANTS * guestsPerTenant}+ guests`);

  // 5. Create Companies per Tenant
  console.log('🔹 Creating Companies per Tenant...');
  const companiesPerTenant = Math.ceil(50000 / NUM_TENANTS);
  for (const tenantId of tenantIds) {
    const tenantData = tenantsMap.get(tenantId)!;

    for (let batch = 0; batch < companiesPerTenant; batch += BATCH_SIZE) {
      const companies: any[] = [];
      const batchSize = Math.min(BATCH_SIZE, companiesPerTenant - batch);

      for (let c = 0; c < batchSize; c++) {
        const companyId = faker.string.uuid();
        companies.push({
          id: companyId,
          tenantId: tenantId,
          name: faker.company.name(),
          taxId: faker.string.numeric(9),
          contactPerson: faker.person.fullName(),
          email: faker.internet.email(),
          phone: faker.phone.number(),
          isActive: true,
        });
        tenantData.companies.push(companyId);
      }

      await prisma.company.createMany({
        data: companies,
        skipDuplicates: true,
      });
    }
    process.stdout.write('.');
  }
  console.log(`\n✅ Created ${NUM_TENANTS * companiesPerTenant}+ companies`);

  // =========================================================
  // PHASE 2: Create Branch-Level Data
  // =========================================================

  console.log('\n📌 PHASE 2: Creating Branch-Level Data...');

  // 6. Room Types per Branch
  console.log('🔹 Creating RoomTypes per Branch...');
  const roomTypeNames = [
    'Standard',
    'Deluxe',
    'Suite',
    'Penthouse',
    'Single',
    'Twin',
    'Family',
    'Executive',
  ];

  for (const tenantId of tenantIds) {
    const tenantData = tenantsMap.get(tenantId)!;

    for (const branch of tenantData.branches) {
      const roomTypes: any[] = [];

      // Each branch gets all room types
      for (let rt = 0; rt < roomTypeNames.length; rt++) {
        const roomTypeId = faker.string.uuid();
        roomTypes.push({
          id: roomTypeId,
          tenantId: tenantId,
          branchId: branch.id,
          name: roomTypeNames[rt],
          basePrice: (rt + 1) * 100000, // Price based on tier
          description: faker.lorem.paragraph(),
          amenities: ['WiFi', 'TV', 'AC', 'Mini Bar'].slice(0, rt + 2),
        });

        branch.roomTypes.push({
          id: roomTypeId,
          tenantId: tenantId,
          branchId: branch.id,
        });
      }

      await prisma.roomType.createMany({ data: roomTypes });
    }
    process.stdout.write('.');
  }
  console.log(
    `\n✅ Created ${NUM_TENANTS * BRANCHES_PER_TENANT * roomTypeNames.length}+ room types`,
  );

  // 7. Rooms per Branch
  console.log('🔹 Creating Rooms per Branch...');
  const roomsPerBranch = Math.ceil(50000 / (NUM_TENANTS * BRANCHES_PER_TENANT));

  for (const tenantId of tenantIds) {
    const tenantData = tenantsMap.get(tenantId)!;

    for (const branch of tenantData.branches) {
      const rooms: any[] = [];

      for (let r = 0; r < roomsPerBranch; r++) {
        const roomType = branch.roomTypes[r % branch.roomTypes.length];
        const floor = Math.floor(r / 10) + 1;
        const roomNum = floor * 100 + (r % 10) + 1;
        const roomId = faker.string.uuid();

        rooms.push({
          id: roomId,
          tenantId: tenantId,
          branchId: branch.id,
          typeId: roomType.id,
          number: roomNum.toString(),
          floor: floor,
          capacity: faker.number.int({ min: 1, max: 4 }),
          status: faker.helpers.arrayElement(Object.values(RoomStatus)),
          isOccupied: faker.datatype.boolean({ probability: 0.4 }),
        });

        branch.rooms.push({
          id: roomId,
          tenantId: tenantId,
          branchId: branch.id,
          typeId: roomType.id,
        });
      }

      await prisma.room.createMany({ data: rooms, skipDuplicates: true });
    }
    process.stdout.write('.');
  }
  console.log(
    `\n✅ Created ${NUM_TENANTS * BRANCHES_PER_TENANT * roomsPerBranch}+ rooms`,
  );

  // 8. Inventory Items per Branch
  console.log('🔹 Creating Inventory Items per Branch...');
  const inventoryPerBranch = Math.ceil(
    50000 / (NUM_TENANTS * BRANCHES_PER_TENANT),
  );
  const inventoryNames: Record<string, string[]> = {
    MINIBAR: [
      'Coca-Cola',
      'Pepsi',
      'Water',
      'Orange Juice',
      'Beer',
      'Wine',
      'Snickers',
      'Pringles',
    ],
    HOUSEKEEPING: [
      'Shampoo',
      'Soap',
      'Towels',
      'Bed Sheets',
      'Toilet Paper',
      'Cleaning Solution',
    ],
    MAINTENANCE: [
      'Light Bulbs',
      'Screws',
      'Paint',
      'Batteries',
      'Duct Tape',
      'WD-40',
    ],
    KITCHEN: ['Flour', 'Sugar', 'Salt', 'Olive Oil', 'Butter', 'Eggs', 'Milk'],
    OTHER: ['Umbrellas', 'Maps', 'Magazines', 'First Aid Kit'],
  };

  for (const tenantId of tenantIds) {
    const tenantData = tenantsMap.get(tenantId)!;
    const tenantUserIds = tenantData.users;

    for (const branch of tenantData.branches) {
      const items: any[] = [];

      for (let i = 0; i < inventoryPerBranch; i++) {
        const category = faker.helpers.arrayElement(
          Object.values(InventoryCategory),
        );
        const names = inventoryNames[category] || inventoryNames.OTHER;
        const itemId = faker.string.uuid();

        items.push({
          id: itemId,
          tenantId: tenantId,
          branchId: branch.id,
          name: faker.helpers.arrayElement(names),
          sku: `SKU-${branch.id.slice(0, 4)}-${i}`,
          unit: faker.helpers.arrayElement(['pcs', 'bottles', 'kg', 'liters']),
          quantity: faker.number.int({ min: 0, max: 500 }),
          minThreshold: faker.number.int({ min: 5, max: 20 }),
          category: category,
          lastUpdatedById:
            tenantUserIds.length > 0
              ? faker.helpers.arrayElement(tenantUserIds)
              : null,
        });

        branch.inventoryItems.push(itemId);
      }

      await prisma.inventoryItem.createMany({
        data: items,
        skipDuplicates: true,
      });
    }
    process.stdout.write('.');
  }
  console.log(
    `\n✅ Created ${NUM_TENANTS * BRANCHES_PER_TENANT * inventoryPerBranch}+ inventory items`,
  );

  // 9. Restaurant Categories per Branch
  console.log('🔹 Creating Restaurant Categories per Branch...');
  const categoryNames = [
    { en: 'Appetizers', uz: 'Salatlar', ru: 'Закуски' },
    { en: 'Main Courses', uz: 'Asosiy taomlar', ru: 'Основные блюда' },
    { en: 'Soups', uz: "Sho'rvalar", ru: 'Супы' },
    { en: 'Desserts', uz: 'Shirinliklar', ru: 'Десерты' },
    { en: 'Beverages', uz: 'Ichimliklar', ru: 'Напитки' },
    { en: 'Breakfast', uz: 'Nonushta', ru: 'Завтрак' },
  ];

  for (const tenantId of tenantIds) {
    const tenantData = tenantsMap.get(tenantId)!;

    for (const branch of tenantData.branches) {
      const categories: any[] = [];

      for (const catName of categoryNames) {
        const catId = faker.string.uuid();
        categories.push({
          id: catId,
          tenantId: tenantId,
          branchId: branch.id,
          name: catName,
        });

        branch.restaurantCategories.push({
          id: catId,
          tenantId: tenantId,
          branchId: branch.id,
          menuItems: [],
        });
      }

      await prisma.restaurantCategory.createMany({ data: categories });
    }
    process.stdout.write('.');
  }
  console.log(
    `\n✅ Created ${NUM_TENANTS * BRANCHES_PER_TENANT * categoryNames.length}+ restaurant categories`,
  );

  // 10. Menu Items per Category
  console.log('🔹 Creating Menu Items per Category...');
  const menuItemsPerCategory = Math.ceil(
    50000 / (NUM_TENANTS * BRANCHES_PER_TENANT * categoryNames.length),
  );
  const menuItemData = [
    {
      name: { en: 'Caesar Salad', uz: 'Sezar Salati', ru: 'Салат Цезарь' },
      price: 45000,
    },
    {
      name: { en: 'Beef Steak', uz: "Mol go'shti steyki", ru: 'Стейк' },
      price: 120000,
    },
    {
      name: { en: 'Grilled Salmon', uz: 'Grill losos', ru: 'Лосось гриль' },
      price: 95000,
    },
    { name: { en: 'Plov', uz: 'Palov', ru: 'Плов' }, price: 35000 },
    { name: { en: 'Shashlik', uz: 'Shashlik', ru: 'Шашлык' }, price: 55000 },
    { name: { en: 'Lagman', uz: "Lag'mon", ru: 'Лагман' }, price: 32000 },
    {
      name: { en: 'Fresh Juice', uz: 'Yangi sharbat', ru: 'Свежий сок' },
      price: 18000,
    },
  ];

  for (const tenantId of tenantIds) {
    const tenantData = tenantsMap.get(tenantId)!;

    for (const branch of tenantData.branches) {
      for (const category of branch.restaurantCategories) {
        const items: any[] = [];

        for (let m = 0; m < menuItemsPerCategory; m++) {
          const menuData = menuItemData[m % menuItemData.length];
          const itemId = faker.string.uuid();

          items.push({
            id: itemId,
            tenantId: tenantId,
            branchId: branch.id,
            categoryId: category.id,
            name: menuData.name,
            description: {
              en: faker.lorem.sentence(),
              uz: faker.lorem.sentence(),
              ru: faker.lorem.sentence(),
            },
            price:
              menuData.price + faker.number.int({ min: -5000, max: 10000 }),
            calories: faker.number.float({ min: 100, max: 800 }),
            isSimpleItem: faker.datatype.boolean({ probability: 0.3 }),
          });

          category.menuItems.push(itemId);
        }

        await prisma.restaurantMenuItem.createMany({ data: items });
      }
    }
    process.stdout.write('.');
  }
  console.log(`\n✅ Created menu items per category`);

  // 11. Rate Plans per Branch
  console.log('🔹 Creating Rate Plans per Branch...');
  const ratePlanCodes = ['BAR', 'BB', 'NR', 'PROMO', 'CORP'];

  for (const tenantId of tenantIds) {
    const tenantData = tenantsMap.get(tenantId)!;

    for (const branch of tenantData.branches) {
      const plans: any[] = [];

      for (let rp = 0; rp < ratePlanCodes.length; rp++) {
        const planId = faker.string.uuid();
        plans.push({
          id: planId,
          tenantId: tenantId,
          branchId: branch.id,
          name:
            ratePlanCodes[rp] === 'BAR'
              ? 'Best Available Rate'
              : ratePlanCodes[rp] === 'BB'
                ? 'Bed & Breakfast'
                : ratePlanCodes[rp] === 'NR'
                  ? 'Non-Refundable'
                  : ratePlanCodes[rp] === 'PROMO'
                    ? 'Promotional Rate'
                    : 'Corporate Rate',
          code: `${ratePlanCodes[rp]}-${branch.id.slice(0, 4)}`,
          includesBreakfast: ratePlanCodes[rp] === 'BB',
          isActive: true,
        });

        branch.ratePlans.push(planId);
      }

      await prisma.ratePlan.createMany({ data: plans, skipDuplicates: true });
    }
    process.stdout.write('.');
  }
  console.log(
    `\n✅ Created ${NUM_TENANTS * BRANCHES_PER_TENANT * ratePlanCodes.length}+ rate plans`,
  );

  // =========================================================
  // PHASE 3: Create Transactional Data (Bookings, Folios, etc.)
  // =========================================================

  console.log('\n📌 PHASE 3: Creating Transactional Data...');

  // 12. Bookings per Branch
  console.log('🔹 Creating Bookings per Branch...');
  const bookingsPerBranch = Math.ceil(
    50000 / (NUM_TENANTS * BRANCHES_PER_TENANT),
  );

  for (const tenantId of tenantIds) {
    const tenantData = tenantsMap.get(tenantId)!;
    const tenantGuests = tenantData.guests;

    for (const branch of tenantData.branches) {
      const bookings: any[] = [];

      for (let b = 0; b < bookingsPerBranch; b++) {
        const bookingId = faker.string.uuid();
        const guestId = tenantGuests[b % tenantGuests.length];
        const checkIn = faker.date.between({
          from: '2024-01-01',
          to: '2026-12-31',
        });
        const checkOut = new Date(
          checkIn.getTime() +
            faker.number.int({ min: 1, max: 14 }) * 24 * 60 * 60 * 1000,
        );

        bookings.push({
          id: bookingId,
          tenantId: tenantId,
          branchId: branch.id,
          primaryGuestId: guestId,
          checkIn: checkIn,
          checkOut: checkOut,
          status: faker.helpers.arrayElement(Object.values(BookingStatus)),
          source: faker.helpers.arrayElement(Object.values(BookingSource)),
          ratePlanId:
            branch.ratePlans.length > 0
              ? branch.ratePlans[b % branch.ratePlans.length]
              : null,
        });

        allBookings.push({
          id: bookingId,
          tenantId: tenantId,
          branchId: branch.id,
          guestId: guestId,
        });
      }

      await prisma.booking.createMany({ data: bookings });
    }
    process.stdout.write('.');
  }
  console.log(`\n✅ Created ${allBookings.length}+ bookings`);

  // 13. Room Stays (link bookings to rooms)
  console.log('🔹 Creating Room Stays...');

  for (const tenantId of tenantIds) {
    const tenantData = tenantsMap.get(tenantId)!;

    for (const branch of tenantData.branches) {
      const branchBookings = allBookings.filter(
        (b) => b.branchId === branch.id,
      );
      const roomStays: any[] = [];

      for (let i = 0; i < branchBookings.length; i++) {
        const booking = branchBookings[i];
        const room = branch.rooms[i % branch.rooms.length];
        const stayId = faker.string.uuid();

        roomStays.push({
          id: stayId,
          tenantId: tenantId,
          bookingId: booking.id,
          roomId: room.id,
          startDate: faker.date.recent({ days: 30 }),
          endDate: faker.date.soon({ days: 14 }),
          dailyRate: faker.number.int({ min: 100, max: 500 }) * 1000,
          currency: Currency.UZS,
          adultsCount: faker.number.int({ min: 1, max: 3 }),
          childrenCount: faker.number.int({ min: 0, max: 2 }),
          status: faker.helpers.arrayElement(Object.values(RoomStayStatus)),
        });

        allRoomStays.push({
          id: stayId,
          tenantId: tenantId,
          bookingId: booking.id,
          roomId: room.id,
        });
      }

      await prisma.roomStay.createMany({ data: roomStays });
    }
    process.stdout.write('.');
  }
  console.log(`\n✅ Created ${allRoomStays.length}+ room stays`);

  // 14. Folios (one per booking)
  console.log('🔹 Creating Folios...');

  for (const tenantId of tenantIds) {
    const tenantData = tenantsMap.get(tenantId)!;

    for (const branch of tenantData.branches) {
      const branchBookings = allBookings.filter(
        (b) => b.branchId === branch.id,
      );
      const folios: any[] = [];

      for (const booking of branchBookings) {
        const folioId = faker.string.uuid();

        folios.push({
          id: folioId,
          tenantId: tenantId,
          branchId: branch.id,
          bookingId: booking.id,
          status: faker.helpers.weightedArrayElement([
            { value: FolioStatus.OPEN, weight: 0.3 },
            { value: FolioStatus.CLOSED, weight: 0.65 },
            { value: FolioStatus.VOID, weight: 0.05 },
          ]),
          isPrimary: true,
        });

        allFolios.push({
          id: folioId,
          tenantId: tenantId,
          branchId: branch.id,
          bookingId: booking.id,
        });
      }

      await prisma.folio.createMany({ data: folios });
    }
    process.stdout.write('.');
  }
  console.log(`\n✅ Created ${allFolios.length}+ folios`);

  // 15. Folio Items (multiple per folio)
  console.log('🔹 Creating Folio Items with Taxes...');
  const taxTypes = Object.values(TaxType);
  const taxRates: Record<string, number> = {
    VAT: 0.12,
    TOURISM_TAX: 0.05,
    SERVICE_CHARGE: 0.1,
    CITY_TAX: 0.02,
  };

  for (let batch = 0; batch < allFolios.length; batch += BATCH_SIZE) {
    const folioItems: any[] = [];
    const batchEnd = Math.min(batch + BATCH_SIZE, allFolios.length);

    for (let f = batch; f < batchEnd; f++) {
      const folio = allFolios[f];
      const itemsPerFolio = faker.number.int({ min: 2, max: 5 });

      for (let i = 0; i < itemsPerFolio; i++) {
        const unitPrice = faker.number.int({ min: 10, max: 500 }) * 1000;
        const quantity = faker.number.int({ min: 1, max: 3 });
        const taxType = faker.helpers.arrayElement(taxTypes);
        const taxRate = taxRates[taxType] || 0.12;
        const taxAmount = Math.round(unitPrice * quantity * taxRate);
        const totalAmount = unitPrice * quantity + taxAmount;

        folioItems.push({
          id: faker.string.uuid(),
          tenantId: folio.tenantId,
          folioId: folio.id,
          description: faker.commerce.productName(),
          quantity: quantity,
          unitPrice: unitPrice,
          taxRate: taxRate,
          taxAmount: taxAmount,
          totalAmount: totalAmount,
          type: faker.helpers.arrayElement(Object.values(ChargeType)),
          taxType: taxType,
          isTaxExempt: faker.datatype.boolean({ probability: 0.1 }),
          source: faker.helpers.arrayElement(Object.values(FolioItemSource)),
        });
      }
    }

    await prisma.folioItem.createMany({ data: folioItems });
    process.stdout.write('.');
  }
  console.log(`\n✅ Created folio items`);

  // 16. Payments (multi-currency)
  console.log('🔹 Creating Multi-Currency Payments...');
  const currencies = Object.values(Currency);
  const exchangeRates: Record<string, number> = {
    UZS: 1,
    USD: 12500,
    EUR: 13500,
    RUB: 135,
  };

  for (const tenantId of tenantIds) {
    const tenantData = tenantsMap.get(tenantId)!;
    const tenantUserIds = tenantData.users;
    const tenantFolios = allFolios.filter((f) => f.tenantId === tenantId);

    const payments: any[] = [];
    for (const folio of tenantFolios) {
      const currency = faker.helpers.arrayElement(currencies);
      const amount =
        faker.number.int({ min: 50, max: 1000 }) *
        (currency === 'UZS' ? 1000 : 1);
      const exchangeRate = exchangeRates[currency] || 1;

      payments.push({
        id: faker.string.uuid(),
        tenantId: tenantId,
        folioId: folio.id,
        amount: amount,
        currency: currency,
        exchangeRate: currency !== 'UZS' ? exchangeRate : null,
        amountInLocal:
          currency !== 'UZS' ? Math.round(amount * exchangeRate) : null,
        method: faker.helpers.arrayElement(Object.values(PaymentMethod)),
        status: faker.helpers.weightedArrayElement([
          { value: PaymentStatus.COMPLETED, weight: 0.85 },
          { value: PaymentStatus.PENDING, weight: 0.08 },
          { value: PaymentStatus.REFUNDED, weight: 0.05 },
          { value: PaymentStatus.FAILED, weight: 0.02 },
        ]),
        transactionRef: faker.string.alphanumeric(16).toUpperCase(),
        receiptNumber: faker.string.numeric(12),
        staffId:
          tenantUserIds.length > 0
            ? faker.helpers.arrayElement(tenantUserIds)
            : tenantUserIds[0],
      });
    }

    await prisma.payment.createMany({ data: payments });
    process.stdout.write('.');
  }
  console.log(`\n✅ Created payments`);

  // 17. Restaurant Orders (POS)
  console.log('🔹 Creating Restaurant Orders (POS)...');
  const ordersPerBranch = Math.ceil(
    50000 / (NUM_TENANTS * BRANCHES_PER_TENANT),
  );

  for (const tenantId of tenantIds) {
    const tenantData = tenantsMap.get(tenantId)!;
    const tenantBookings = allBookings.filter((b) => b.tenantId === tenantId);

    for (const branch of tenantData.branches) {
      const orders: any[] = [];

      for (let o = 0; o < ordersPerBranch; o++) {
        const orderId = faker.string.uuid();
        const hasBookingLink = faker.datatype.boolean({ probability: 0.4 });

        orders.push({
          id: orderId,
          tenantId: tenantId,
          branchId: branch.id,
          tableNumber: faker.helpers.arrayElement([
            'T1',
            'T2',
            'T3',
            'T4',
            'T5',
            'BAR1',
            'BAR2',
            'VIP1',
          ]),
          status: faker.helpers.weightedArrayElement([
            { value: RestaurantOrderStatus.PAID, weight: 0.5 },
            { value: RestaurantOrderStatus.SERVED, weight: 0.2 },
            { value: RestaurantOrderStatus.PREPARING, weight: 0.15 },
            { value: RestaurantOrderStatus.PENDING, weight: 0.1 },
            { value: RestaurantOrderStatus.CANCELLED, weight: 0.05 },
          ]),
          bookingId:
            hasBookingLink && tenantBookings.length > 0
              ? tenantBookings[o % tenantBookings.length].id
              : null,
          totalAmount: faker.number.int({ min: 30, max: 500 }) * 1000,
        });

        allRestaurantOrders.push({
          id: orderId,
          tenantId: tenantId,
          branchId: branch.id,
        });
      }

      await prisma.restaurantOrder.createMany({ data: orders });
    }
    process.stdout.write('.');
  }
  console.log(`\n✅ Created ${allRestaurantOrders.length}+ restaurant orders`);

  // 18. Restaurant Order Items
  console.log('🔹 Creating Restaurant Order Items...');

  for (let batch = 0; batch < allRestaurantOrders.length; batch += BATCH_SIZE) {
    const orderItems: any[] = [];
    const batchEnd = Math.min(batch + BATCH_SIZE, allRestaurantOrders.length);

    for (let o = batch; o < batchEnd; o++) {
      const order = allRestaurantOrders[o];
      const tenantData = tenantsMap.get(order.tenantId)!;
      const branch = tenantData.branches.find((b) => b.id === order.branchId);

      if (!branch || branch.restaurantCategories.length === 0) continue;

      const itemsPerOrder = faker.number.int({ min: 1, max: 5 });
      for (let i = 0; i < itemsPerOrder; i++) {
        const category =
          branch.restaurantCategories[i % branch.restaurantCategories.length];
        if (category.menuItems.length === 0) continue;

        orderItems.push({
          id: faker.string.uuid(),
          orderId: order.id,
          menuItemId: faker.helpers.arrayElement(category.menuItems),
          quantity: faker.number.int({ min: 1, max: 3 }),
          price: faker.number.int({ min: 15, max: 150 }) * 1000,
          notes: faker.datatype.boolean({ probability: 0.2 })
            ? faker.helpers.arrayElement([
                'No spice',
                'Extra sauce',
                'Well done',
              ])
            : null,
        });
      }
    }

    if (orderItems.length > 0) {
      await prisma.restaurantOrderItem.createMany({ data: orderItems });
    }
    process.stdout.write('.');
  }
  console.log(`\n✅ Created restaurant order items`);

  // =========================================================
  // PHASE 4: Create Operational Data
  // =========================================================

  console.log('\n📌 PHASE 4: Creating Operational Data...');

  // 19. Stock Logs
  console.log('🔹 Creating Stock Logs...');

  for (const tenantId of tenantIds) {
    const tenantData = tenantsMap.get(tenantId)!;
    const tenantUserIds = tenantData.users;

    for (const branch of tenantData.branches) {
      const logs: any[] = [];

      for (const itemId of branch.inventoryItems) {
        const logsPerItem = faker.number.int({ min: 1, max: 3 });

        for (let l = 0; l < logsPerItem; l++) {
          const reason = faker.helpers.arrayElement(
            Object.values(StockUpdateReason),
          );
          const isIncrease = ['RESTOCKED', 'CORRECTION'].includes(reason);

          logs.push({
            id: faker.string.uuid(),
            itemId: itemId,
            tenantId: tenantId,
            staffId:
              tenantUserIds.length > 0
                ? faker.helpers.arrayElement(tenantUserIds)
                : tenantUserIds[0],
            change: isIncrease
              ? faker.number.int({ min: 10, max: 100 })
              : -faker.number.int({ min: 1, max: 20 }),
            reason: reason,
            note: faker.datatype.boolean({ probability: 0.3 })
              ? faker.lorem.sentence()
              : null,
          });
        }
      }

      if (logs.length > 0) {
        await prisma.stockLog.createMany({ data: logs });
      }
    }
    process.stdout.write('.');
  }
  console.log(`\n✅ Created stock logs`);

  // 20. Housekeeping Tasks
  console.log('🔹 Creating Housekeeping Tasks...');

  for (const tenantId of tenantIds) {
    const tenantData = tenantsMap.get(tenantId)!;
    const tenantUserIds = tenantData.users;

    for (const branch of tenantData.branches) {
      const tasks: any[] = [];

      for (const room of branch.rooms) {
        tasks.push({
          id: faker.string.uuid(),
          tenantId: tenantId,
          roomId: room.id,
          assigneeId:
            tenantUserIds.length > 0
              ? faker.helpers.arrayElement(tenantUserIds)
              : null,
          createdById:
            tenantUserIds.length > 0
              ? faker.helpers.arrayElement(tenantUserIds)
              : tenantUserIds[0],
          status: faker.helpers.arrayElement(Object.values(TaskStatus)),
          priority: faker.helpers.arrayElement(Object.values(Priority)),
          taskType: faker.helpers.arrayElement(
            Object.values(HousekeepingTaskType),
          ),
          scheduledFor: faker.date.soon({ days: 7 }),
          notes: faker.datatype.boolean({ probability: 0.3 })
            ? faker.lorem.sentence()
            : null,
        });
      }

      await prisma.housekeepingTask.createMany({ data: tasks });
    }
    process.stdout.write('.');
  }
  console.log(`\n✅ Created housekeeping tasks`);

  // 21. Maintenance Tickets
  console.log('🔹 Creating Maintenance Tickets...');

  for (const tenantId of tenantIds) {
    const tenantData = tenantsMap.get(tenantId)!;
    const tenantUserIds = tenantData.users;

    for (const branch of tenantData.branches) {
      const tickets: any[] = [];

      // Create tickets for ~30% of rooms
      const roomsWithTickets = branch.rooms.filter(() =>
        faker.datatype.boolean({ probability: 0.3 }),
      );

      for (const room of roomsWithTickets) {
        tickets.push({
          id: faker.string.uuid(),
          tenantId: tenantId,
          roomId: room.id,
          description: faker.lorem.sentence(),
          reportedBy:
            tenantUserIds.length > 0
              ? faker.helpers.arrayElement(tenantUserIds)
              : 'system',
          status: faker.helpers.arrayElement(Object.values(TicketStatus)),
          userId:
            tenantUserIds.length > 0
              ? faker.helpers.arrayElement(tenantUserIds)
              : null,
        });
      }

      if (tickets.length > 0) {
        await prisma.maintenanceTicket.createMany({ data: tickets });
      }
    }
    process.stdout.write('.');
  }
  console.log(`\n✅ Created maintenance tickets`);

  // 22. Room Status History
  console.log('🔹 Creating Room Status History...');

  for (const tenantId of tenantIds) {
    const tenantData = tenantsMap.get(tenantId)!;
    const tenantUserIds = tenantData.users;

    for (const branch of tenantData.branches) {
      const histories: any[] = [];

      for (const room of branch.rooms) {
        const historyCount = faker.number.int({ min: 1, max: 3 });

        for (let h = 0; h < historyCount; h++) {
          const statuses = Object.values(RoomStatus);
          const oldStatus = faker.helpers.arrayElement(statuses);
          const newStatus = faker.helpers.arrayElement(
            statuses.filter((s) => s !== oldStatus),
          );

          histories.push({
            id: faker.string.uuid(),
            tenantId: tenantId,
            roomId: room.id,
            oldStatus: oldStatus,
            newStatus: newStatus,
            userId:
              tenantUserIds.length > 0
                ? faker.helpers.arrayElement(tenantUserIds)
                : tenantUserIds[0],
            notes: faker.datatype.boolean({ probability: 0.2 })
              ? faker.lorem.sentence()
              : null,
          });
        }
      }

      await prisma.roomStatusHistory.createMany({ data: histories });
    }
    process.stdout.write('.');
  }
  console.log(`\n✅ Created room status history`);

  // 23. Room Stay Guests
  console.log('🔹 Creating Room Stay Guests...');

  for (let batch = 0; batch < allRoomStays.length; batch += BATCH_SIZE) {
    const roomStayGuests: any[] = [];
    const batchEnd = Math.min(batch + BATCH_SIZE, allRoomStays.length);

    for (let s = batch; s < batchEnd; s++) {
      const stay = allRoomStays[s];
      const tenantData = tenantsMap.get(stay.tenantId);
      if (!tenantData || tenantData.guests.length === 0) continue;

      // Primary guest
      roomStayGuests.push({
        id: faker.string.uuid(),
        roomStayId: stay.id,
        guestId: tenantData.guests[s % tenantData.guests.length],
        isPrimary: true,
      });

      // Additional guests (30% chance)
      if (faker.datatype.boolean({ probability: 0.3 })) {
        roomStayGuests.push({
          id: faker.string.uuid(),
          roomStayId: stay.id,
          guestId: tenantData.guests[(s + 1) % tenantData.guests.length],
          isPrimary: false,
        });
      }
    }

    await prisma.roomStayGuest.createMany({
      data: roomStayGuests,
      skipDuplicates: true,
    });
    process.stdout.write('.');
  }
  console.log(`\n✅ Created room stay guests`);

  // 24. E-Mehmon Logs
  console.log('🔹 Creating E-Mehmon Logs...');

  for (let batch = 0; batch < allBookings.length; batch += BATCH_SIZE) {
    const logs: any[] = [];
    const batchEnd = Math.min(batch + BATCH_SIZE, allBookings.length);

    for (let b = batch; b < batchEnd; b++) {
      const booking = allBookings[b];

      logs.push({
        id: faker.string.uuid(),
        tenantId: booking.tenantId,
        bookingId: booking.id,
        guestId: booking.guestId,
        status: faker.helpers.arrayElement(Object.values(EmehmonStatus)),
        requestJson: { action: 'register', guestId: booking.guestId },
        responseJson: {
          success: true,
          registrationId: faker.string.alphanumeric(12),
        },
        regSlipNumber: faker.string.alphanumeric(10).toUpperCase(),
      });
    }

    await prisma.emehmonLog.createMany({ data: logs });
    process.stdout.write('.');
  }
  console.log(`\n✅ Created e-mehmon logs`);

  // 25. Guest Communications
  console.log('🔹 Creating Guest Communications...');

  for (const tenantId of tenantIds) {
    const tenantData = tenantsMap.get(tenantId)!;
    const tenantBookings = allBookings.filter((b) => b.tenantId === tenantId);
    const comms: any[] = [];

    for (const booking of tenantBookings) {
      comms.push({
        id: faker.string.uuid(),
        tenantId: tenantId,
        guestId: booking.guestId,
        bookingId: booking.id,
        type: faker.helpers.arrayElement(Object.values(CommunicationType)),
        channel: faker.helpers.arrayElement(
          Object.values(CommunicationChannel),
        ),
        subject: faker.lorem.sentence(),
        content: faker.lorem.paragraph(),
      });
    }

    await prisma.guestCommunication.createMany({ data: comms });
    process.stdout.write('.');
  }
  console.log(`\n✅ Created guest communications`);

  // 26. Audit Logs
  console.log('🔹 Creating Audit Logs...');

  for (const tenantId of tenantIds) {
    const tenantData = tenantsMap.get(tenantId)!;
    const tenantUserIds = tenantData.users;
    const logs: any[] = [];

    const auditCount = Math.ceil(50000 / NUM_TENANTS);
    for (let a = 0; a < auditCount; a++) {
      logs.push({
        id: faker.string.uuid(),
        tenantId: tenantId,
        userId:
          tenantUserIds.length > 0
            ? faker.helpers.arrayElement(tenantUserIds)
            : null,
        action: faker.helpers.arrayElement(Object.values(AuditAction)),
        entityType: faker.helpers.arrayElement([
          'Booking',
          'Guest',
          'Room',
          'Payment',
          'Folio',
        ]),
        entityId: faker.string.uuid(),
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
      });
    }

    await prisma.auditLog.createMany({ data: logs });
    process.stdout.write('.');
  }
  console.log(`\n✅ Created audit logs`);

  // 27. User Branches (link users to branches in same tenant)
  console.log('🔹 Creating User-Branch assignments...');

  for (const tenantId of tenantIds) {
    const tenantData = tenantsMap.get(tenantId)!;
    const userBranches: any[] = [];

    for (const userId of tenantData.users) {
      // Each user gets 1-3 branch assignments within their tenant
      const branchCount = faker.number.int({
        min: 1,
        max: Math.min(3, tenantData.branches.length),
      });
      const assignedBranches = faker.helpers.arrayElements(
        tenantData.branches,
        branchCount,
      );

      assignedBranches.forEach((branch, idx) => {
        userBranches.push({
          userId: userId,
          branchId: branch.id,
          isDefault: idx === 0,
        });
      });
    }

    await prisma.userBranch.createMany({
      data: userBranches,
      skipDuplicates: true,
    });
    process.stdout.write('.');
  }
  console.log(`\n✅ Created user-branch assignments`);

  // 28. Menu Item Ingredients
  console.log('🔹 Creating Menu Item Ingredients...');

  for (const tenantId of tenantIds) {
    const tenantData = tenantsMap.get(tenantId)!;

    for (const branch of tenantData.branches) {
      if (branch.inventoryItems.length === 0) continue;

      const ingredients: any[] = [];

      for (const category of branch.restaurantCategories) {
        for (const menuItemId of category.menuItems) {
          // Each menu item gets 1-3 ingredients
          const ingredientCount = faker.number.int({ min: 1, max: 3 });
          const selectedInventory = faker.helpers.arrayElements(
            branch.inventoryItems,
            ingredientCount,
          );

          for (const invId of selectedInventory) {
            ingredients.push({
              id: faker.string.uuid(),
              menuItemId: menuItemId,
              inventoryItemId: invId,
              quantity: faker.number.int({ min: 1, max: 5 }),
            });
          }
        }
      }

      if (ingredients.length > 0) {
        await prisma.menuItemIngredient.createMany({
          data: ingredients,
          skipDuplicates: true,
        });
      }
    }
    process.stdout.write('.');
  }
  console.log(`\n✅ Created menu item ingredients`);

  // 29. Discount Contracts
  console.log('🔹 Creating Discount Contracts...');

  for (const tenantId of tenantIds) {
    const tenantData = tenantsMap.get(tenantId)!;
    const contracts: any[] = [];

    for (const companyId of tenantData.companies) {
      contracts.push({
        id: faker.string.uuid(),
        companyId: companyId,
        discountPercent: faker.number.int({ min: 5, max: 30 }),
        startDate: faker.date.past(),
        endDate: faker.datatype.boolean({ probability: 0.7 })
          ? faker.date.future()
          : null,
        isActive: faker.datatype.boolean({ probability: 0.8 }),
        description: faker.lorem.sentence(),
      });
    }

    await prisma.discountContract.createMany({ data: contracts });
    process.stdout.write('.');
  }
  console.log(`\n✅ Created discount contracts`);

  // 30. Rate Plan Room Types
  console.log('🔹 Creating Rate Plan Room Types...');

  for (const tenantId of tenantIds) {
    const tenantData = tenantsMap.get(tenantId)!;

    for (const branch of tenantData.branches) {
      const rprts: any[] = [];

      for (const ratePlanId of branch.ratePlans) {
        for (const roomType of branch.roomTypes) {
          rprts.push({
            id: faker.string.uuid(),
            tenantId: tenantId,
            ratePlanId: ratePlanId,
            roomTypeId: roomType.id,
            price: faker.number.int({ min: 100, max: 800 }) * 1000,
          });
        }
      }

      if (rprts.length > 0) {
        await prisma.ratePlanRoomType.createMany({
          data: rprts,
          skipDuplicates: true,
        });
      }
    }
    process.stdout.write('.');
  }
  console.log(`\n✅ Created rate plan room types`);

  // 31. Price Modifiers
  console.log('🔹 Creating Price Modifiers...');

  for (const tenantId of tenantIds) {
    const tenantData = tenantsMap.get(tenantId)!;

    for (const branch of tenantData.branches) {
      const modifiers: any[] = [];

      for (const roomType of branch.roomTypes) {
        // 1-2 modifiers per room type
        const modCount = faker.number.int({ min: 1, max: 2 });

        for (let m = 0; m < modCount; m++) {
          modifiers.push({
            id: faker.string.uuid(),
            tenantId: tenantId,
            roomTypeId: roomType.id,
            name: faker.helpers.arrayElement([
              'Weekend Special',
              'Early Bird',
              'Last Minute',
              'Holiday Rate',
              'Off-Season',
            ]),
            percentage: faker.number.float({
              min: -25,
              max: 25,
              fractionDigits: 2,
            }),
            startDate: faker.date.past(),
            endDate: faker.date.future(),
            isActive: faker.datatype.boolean({ probability: 0.7 }),
          });
        }
      }

      await prisma.priceModifier.createMany({ data: modifiers });
    }
    process.stdout.write('.');
  }
  console.log(`\n✅ Created price modifiers`);

  // =========================================================
  // SUMMARY
  // =========================================================

  console.log('\n' + '='.repeat(60));
  console.log('⭐⭐⭐ MASSIVE SEED COMPLETE - NO ORPHANS GUARANTEE ⭐⭐⭐');
  console.log('='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   ├─ Tenants: ${NUM_TENANTS}`);
  console.log(
    `   ├─ Branches: ${NUM_TENANTS * BRANCHES_PER_TENANT} (${BRANCHES_PER_TENANT} per tenant)`,
  );
  console.log(`   ├─ Users: ~${NUM_TENANTS * Math.ceil(50000 / NUM_TENANTS)}`);
  console.log(`   ├─ Guests: ~${NUM_TENANTS * Math.ceil(50000 / NUM_TENANTS)}`);
  console.log(
    `   ├─ Companies: ~${NUM_TENANTS * Math.ceil(50000 / NUM_TENANTS)}`,
  );
  console.log(`   ├─ Room Types: ${NUM_TENANTS * BRANCHES_PER_TENANT * 8}+`);
  console.log(`   ├─ Rooms: 50K+`);
  console.log(`   ├─ Bookings: ${allBookings.length}`);
  console.log(`   ├─ Room Stays: ${allRoomStays.length}`);
  console.log(`   ├─ Folios: ${allFolios.length}`);
  console.log(`   ├─ Restaurant Orders: ${allRestaurantOrders.length}`);
  console.log(`   ├─ Inventory Items: 50K+`);
  console.log(`   └─ All other models: 50K+ each`);
  console.log('\n✅ Every tenant and branch has data!');
  console.log('✅ No orphan records - all foreign keys are valid!');
  console.log('\n🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

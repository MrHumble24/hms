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
  SubscriptionStatus,
  PlanType,
  CommunicationType,
  CommunicationChannel,
  CommunicationStatus,
  AuditAction,
  CancellationPolicy,
  VisaType,
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

const BATCH_SIZE = 5000;
const TARGET_COUNT = 50000;

async function main() {
  console.log(
    '🚀 Starting massive seed specialized for 50K records per model...',
  );

  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('password123', salt);

  // 1. Tenants (Starting with 100 to support 50k users/branches effectively)
  console.log('🔹 Seeding Tenants...');
  const tenantIds: string[] = [];
  for (let i = 0; i < 100; i++) {
    const tenant = await prisma.tenant.create({
      data: {
        name: faker.company.name(),
        slug: faker.string.uuid() + '-' + faker.lorem.slug(),
        isActive: true,
        planType: faker.helpers.arrayElement(Object.values(PlanType)),
      },
    });
    tenantIds.push(tenant.id);
  }

  // 2. Branches (Target 50K)
  console.log('🔹 Seeding 50K Branches...');
  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const branches = Array.from({ length: BATCH_SIZE }).map(() => ({
      id: faker.string.uuid(),
      name: faker.company.name() + ' Branch',
      tenantId: faker.helpers.arrayElement(tenantIds),
      isActive: true,
    }));
    await prisma.branch.createMany({ data: branches });
    process.stdout.write(`.`);
  }
  console.log('\n✅ Branches done.');

  // Get some branch IDs for relations
  const sampleBranches = await prisma.branch.findMany({
    take: 1000,
    select: { id: true, tenantId: true },
  });

  // 3. Companies (Target 50K)
  console.log('🔹 Seeding 50K Companies...');
  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const companies = Array.from({ length: BATCH_SIZE }).map(() => ({
      id: faker.string.uuid(),
      tenantId: faker.helpers.arrayElement(tenantIds),
      name: faker.company.name(),
      taxId: faker.string.numeric(9),
      isActive: true,
    }));
    await prisma.company.createMany({ data: companies, skipDuplicates: true });
    process.stdout.write(`.`);
  }
  console.log('\n✅ Companies done.');

  // 4. Users (Target 50K)
  console.log('🔹 Seeding 50K Users...');

  // Create test accounts first
  const testUsers = [
    {
      id: faker.string.uuid(),
      email: 'superadmin@hms.com',
      password: password,
      fullName: 'Super Admin User',
      role: Role.SUPER_ADMIN,
      tenantId: tenantIds[0],
      isActive: true,
    },
    {
      id: faker.string.uuid(),
      email: 'admin@hms.com',
      password: password,
      fullName: 'Tenant Admin User',
      role: Role.ADMIN,
      tenantId: tenantIds[0],
      isActive: true,
    },
  ];
  await prisma.user.createMany({ data: testUsers, skipDuplicates: true });

  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const users = Array.from({ length: BATCH_SIZE }).map(() => ({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: password,
      fullName: faker.person.fullName(),
      role: faker.helpers.arrayElement(Object.values(Role)),
      tenantId: faker.helpers.arrayElement(tenantIds),
      isActive: true,
    }));
    await prisma.user.createMany({ data: users, skipDuplicates: true });
    process.stdout.write(`.`);
  }
  console.log('\n✅ Users done.');

  // 5. Guests (Target 50K)
  console.log('🔹 Seeding 50K Guests...');
  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const guests = Array.from({ length: BATCH_SIZE }).map(() => ({
      id: faker.string.uuid(),
      tenantId: faker.helpers.arrayElement(tenantIds),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phone: faker.phone.number(),
      citizenship: 'UZB',
      passportSeries: faker.string.alpha(2).toUpperCase(),
      passportNumber: faker.string.numeric(7),
      dateOfBirth: faker.date.birthdate(),
      gender: faker.helpers.arrayElement(['MALE', 'FEMALE'] as Gender[]),
    }));
    await prisma.guest.createMany({ data: guests, skipDuplicates: true });
    process.stdout.write(`.`);
  }
  console.log('\n✅ Guests done.');

  // 6. RoomTypes (Target 50K)
  console.log('🔹 Seeding 50K RoomTypes...');
  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const roomTypes = Array.from({ length: BATCH_SIZE }).map(() => {
      const branch = faker.helpers.arrayElement(sampleBranches);
      return {
        id: faker.string.uuid(),
        tenantId: branch.tenantId,
        branchId: branch.id,
        name: faker.helpers.arrayElement([
          'Standard',
          'Deluxe',
          'Suite',
          'Penthouse',
          'Single',
          'Twin',
        ]),
        basePrice: faker.number.int({ min: 50, max: 1000 }) * 1000,
      };
    });
    await prisma.roomType.createMany({ data: roomTypes });
    process.stdout.write(`.`);
  }
  console.log('\n✅ RoomTypes done.');

  const sampleRoomTypes = await prisma.roomType.findMany({
    take: 1000,
    select: { id: true, tenantId: true, branchId: true },
  });

  // 7. Rooms (Target 50K)
  console.log('🔹 Seeding 50K Rooms...');
  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const rooms = Array.from({ length: BATCH_SIZE }).map(() => {
      const type = faker.helpers.arrayElement(sampleRoomTypes);
      return {
        id: faker.string.uuid(),
        tenantId: type.tenantId,
        branchId: type.branchId,
        typeId: type.id,
        number: faker.string.numeric(3),
        floor: faker.number.int({ min: 1, max: 10 }),
        status: faker.helpers.arrayElement(Object.values(RoomStatus)),
      };
    });
    await prisma.room.createMany({ data: rooms, skipDuplicates: true });
    process.stdout.write(`.`);
  }
  console.log('\n✅ Rooms done.');

  const sampleRooms = await prisma.room.findMany({
    take: 1000,
    select: { id: true, tenantId: true, branchId: true },
  });
  const guestIds = (
    await prisma.guest.findMany({ take: 1000, select: { id: true } })
  ).map((g) => g.id);

  // 8. Bookings (Target 50K)
  console.log('🔹 Seeding 50K Bookings...');
  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const bookings = Array.from({ length: BATCH_SIZE }).map(() => {
      const branch = faker.helpers.arrayElement(sampleBranches);
      return {
        id: faker.string.uuid(),
        tenantId: branch.tenantId,
        branchId: branch.id,
        primaryGuestId: faker.helpers.arrayElement(guestIds),
        checkIn: faker.date.past(),
        checkOut: faker.date.soon(),
        status: faker.helpers.arrayElement(Object.values(BookingStatus)),
        source: faker.helpers.arrayElement(Object.values(BookingSource)),
      };
    });
    await prisma.booking.createMany({ data: bookings });
    process.stdout.write(`.`);
  }
  console.log('\n✅ Bookings done.');

  const bookingIds = await prisma.booking.findMany({
    take: 1000,
    select: { id: true, tenantId: true },
  });

  // 9. Folios (Target 50K)
  console.log('🔹 Seeding 50K Folios...');
  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const folios = Array.from({ length: BATCH_SIZE }).map(() => {
      const b = faker.helpers.arrayElement(bookingIds);
      const branch = faker.helpers.arrayElement(sampleBranches);
      return {
        id: faker.string.uuid(),
        tenantId: b.tenantId,
        branchId: branch.id,
        bookingId: b.id,
        status: faker.helpers.arrayElement(Object.values(FolioStatus)),
        isPrimary: true,
      };
    });
    await prisma.folio.createMany({ data: folios });
    process.stdout.write(`.`);
  }
  console.log('\n✅ Folios done.');

  const folioIds = await prisma.folio.findMany({
    take: 1000,
    select: { id: true, tenantId: true },
  });

  // 10. FolioItems (Target 50K)
  console.log('🔹 Seeding 50K FolioItems...');
  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const items = Array.from({ length: BATCH_SIZE }).map(() => {
      const f = faker.helpers.arrayElement(folioIds);
      const price = faker.number.int({ min: 10, max: 500 }) * 1000;
      return {
        id: faker.string.uuid(),
        tenantId: f.tenantId,
        folioId: f.id,
        description: faker.commerce.productName(),
        quantity: faker.number.int({ min: 1, max: 5 }),
        unitPrice: price,
        totalAmount: price,
        type: faker.helpers.arrayElement(Object.values(ChargeType)),
      };
    });
    await prisma.folioItem.createMany({ data: items });
    process.stdout.write(`.`);
  }
  console.log('\n✅ FolioItems done.');

  // 11. Payments (Target 50K)
  console.log('🔹 Seeding 50K Payments...');
  const userIds = (
    await prisma.user.findMany({ take: 1000, select: { id: true } })
  ).map((u) => u.id);
  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const payments = Array.from({ length: BATCH_SIZE }).map(() => {
      const f = faker.helpers.arrayElement(folioIds);
      return {
        id: faker.string.uuid(),
        tenantId: f.tenantId,
        folioId: f.id,
        amount: faker.number.int({ min: 10, max: 500 }) * 1000,
        currency: Currency.UZS,
        method: faker.helpers.arrayElement(Object.values(PaymentMethod)),
        status: PaymentStatus.COMPLETED,
        staffId: faker.helpers.arrayElement(userIds),
      };
    });
    await prisma.payment.createMany({ data: payments });
    process.stdout.write(`.`);
  }
  console.log('\n✅ Payments done.');

  // 12. HousekeepingTasks (Target 50K)
  console.log('🔹 Seeding 50K HousekeepingTasks...');
  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const tasks = Array.from({ length: BATCH_SIZE }).map(() => {
      const room = faker.helpers.arrayElement(sampleRooms);
      return {
        id: faker.string.uuid(),
        tenantId: room.tenantId,
        roomId: room.id,
        assigneeId: faker.helpers.arrayElement(userIds),
        createdById: faker.helpers.arrayElement(userIds),
        status: faker.helpers.arrayElement(Object.values(TaskStatus)),
        priority: faker.helpers.arrayElement(Object.values(Priority)),
        taskType: faker.helpers.arrayElement(
          Object.values(HousekeepingTaskType),
        ),
      };
    });
    await prisma.housekeepingTask.createMany({ data: tasks });
    process.stdout.write(`.`);
  }
  console.log('\n✅ HousekeepingTasks done.');

  // 13. AuditLogs (Target 50K)
  console.log('🔹 Seeding 50K AuditLogs...');
  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const logs = Array.from({ length: BATCH_SIZE }).map(() => ({
      id: faker.string.uuid(),
      tenantId: faker.helpers.arrayElement(tenantIds),
      userId: faker.helpers.arrayElement(userIds),
      action: faker.helpers.arrayElement(Object.values(AuditAction)),
      entityType: faker.helpers.arrayElement([
        'Booking',
        'Guest',
        'Room',
        'Payment',
      ]),
      entityId: faker.string.uuid(),
    }));
    await prisma.auditLog.createMany({ data: logs });
    process.stdout.write(`.`);
  }
  console.log('\n✅ AuditLogs done.');

  // 14. RestaurantCategories (Target 50K)
  console.log('🔹 Seeding 50K RestaurantCategories...');
  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const cats = Array.from({ length: BATCH_SIZE }).map(() => {
      const branch = faker.helpers.arrayElement(sampleBranches);
      return {
        id: faker.string.uuid(),
        tenantId: branch.tenantId,
        branchId: branch.id,
        name: { en: faker.commerce.department() },
      };
    });
    await prisma.restaurantCategory.createMany({ data: cats });
    process.stdout.write(`.`);
  }
  console.log('\n✅ RestaurantCategories done.');

  const sampleCats = await prisma.restaurantCategory.findMany({
    take: 1000,
    select: { id: true, tenantId: true, branchId: true },
  });

  // 15. RestaurantMenuItems (Target 50K)
  console.log('🔹 Seeding 50K RestaurantMenuItems...');
  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const items = Array.from({ length: BATCH_SIZE }).map(() => {
      const cat = faker.helpers.arrayElement(sampleCats);
      return {
        id: faker.string.uuid(),
        tenantId: cat.tenantId,
        branchId: cat.branchId,
        categoryId: cat.id,
        name: { en: faker.commerce.productName() },
        price: faker.number.int({ min: 5, max: 100 }) * 1000,
      };
    });
    await prisma.restaurantMenuItem.createMany({ data: items });
    process.stdout.write(`.`);
  }
  console.log('\n✅ RestaurantMenuItems done.');

  const sampleMenuItems = await prisma.restaurantMenuItem.findMany({
    take: 1000,
    select: { id: true },
  });

  // 16. RestaurantOrders (Target 50K)
  console.log('🔹 Seeding 50K RestaurantOrders...');
  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const orders = Array.from({ length: BATCH_SIZE }).map(() => {
      const branch = faker.helpers.arrayElement(sampleBranches);
      return {
        id: faker.string.uuid(),
        tenantId: branch.tenantId,
        branchId: branch.id,
        status: faker.helpers.arrayElement(
          Object.values(RestaurantOrderStatus),
        ),
        totalAmount: faker.number.int({ min: 10, max: 500 }) * 1000,
      };
    });
    await prisma.restaurantOrder.createMany({ data: orders });
    process.stdout.write(`.`);
  }
  console.log('\n✅ RestaurantOrders done.');

  const orderIds = (
    await prisma.restaurantOrder.findMany({ take: 1000, select: { id: true } })
  ).map((o) => o.id);

  // 17. RestaurantOrderItems (Target 50K)
  console.log('🔹 Seeding 50K RestaurantOrderItems...');
  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const items = Array.from({ length: BATCH_SIZE }).map(() => ({
      id: faker.string.uuid(),
      orderId: faker.helpers.arrayElement(orderIds),
      menuItemId: faker.helpers.arrayElement(sampleMenuItems).id,
      quantity: faker.number.int({ min: 1, max: 5 }),
      price: faker.number.int({ min: 5, max: 100 }) * 1000,
    }));
    await prisma.restaurantOrderItem.createMany({ data: items });
    process.stdout.write(`.`);
  }
  console.log('\n✅ RestaurantOrderItems done.');

  // 18. InventoryItems (Target 50K)
  console.log('🔹 Seeding 50K InventoryItems...');
  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const items = Array.from({ length: BATCH_SIZE }).map(() => {
      const branch = faker.helpers.arrayElement(sampleBranches);
      return {
        id: faker.string.uuid(),
        tenantId: branch.tenantId,
        branchId: branch.id,
        name: faker.commerce.product(),
        sku: faker.string.alphanumeric(8),
        unit: 'pcs',
        quantity: faker.number.int({ min: 0, max: 1000 }),
        category: faker.helpers.arrayElement(Object.values(InventoryCategory)),
      };
    });
    await prisma.inventoryItem.createMany({
      data: items,
      skipDuplicates: true,
    });
    process.stdout.write(`.`);
  }
  console.log('\n✅ InventoryItems done.');

  const inventoryIds = await prisma.inventoryItem.findMany({
    take: 1000,
    select: { id: true, tenantId: true },
  });

  // 19. StockLogs (Target 50K)
  console.log('🔹 Seeding 50K StockLogs...');
  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const logs = Array.from({ length: BATCH_SIZE }).map(() => {
      const item = faker.helpers.arrayElement(inventoryIds);
      return {
        id: faker.string.uuid(),
        itemId: item.id,
        tenantId: item.tenantId,
        staffId: faker.helpers.arrayElement(userIds),
        change: faker.number.int({ min: -50, max: 50 }),
        reason: faker.helpers.arrayElement(Object.values(StockUpdateReason)),
      };
    });
    await prisma.stockLog.createMany({ data: logs });
    process.stdout.write(`.`);
  }
  console.log('\n✅ StockLogs done.');

  // 20. RoomStays (Target 50K)
  console.log('🔹 Seeding 50K RoomStays...');
  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const stays = Array.from({ length: BATCH_SIZE }).map(() => {
      const b = faker.helpers.arrayElement(bookingIds);
      const room = faker.helpers.arrayElement(sampleRooms);
      return {
        id: faker.string.uuid(),
        tenantId: b.tenantId,
        bookingId: b.id,
        roomId: room.id,
        startDate: faker.date.recent(),
        endDate: faker.date.future(),
        dailyRate: faker.number.int({ min: 50, max: 500 }) * 1000,
        status: 'RESERVED' as any, // Cast to any or use RoomStayStatus.RESERVED
      };
    });
    await prisma.roomStay.createMany({ data: stays });
    process.stdout.write(`.`);
  }
  console.log('\n✅ RoomStays done.');

  // 21. MaintenanceTickets (Target 50K)
  console.log('🔹 Seeding 50K MaintenanceTickets...');
  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const tickets = Array.from({ length: BATCH_SIZE }).map(() => {
      const room = faker.helpers.arrayElement(sampleRooms);
      return {
        id: faker.string.uuid(),
        tenantId: room.tenantId,
        roomId: room.id,
        description: faker.lorem.sentence(),
        reportedBy: faker.helpers.arrayElement(userIds),
        status: faker.helpers.arrayElement(Object.values(TicketStatus)),
      };
    });
    await prisma.maintenanceTicket.createMany({ data: tickets });
    process.stdout.write(`.`);
  }
  console.log('\n✅ MaintenanceTickets done.');

  // 22. EmehmonLog (Target 50K)
  console.log('🔹 Seeding 50K EmehmonLogs...');
  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const logs = Array.from({ length: BATCH_SIZE }).map(() => {
      const b = faker.helpers.arrayElement(bookingIds);
      return {
        id: faker.string.uuid(),
        tenantId: b.tenantId,
        bookingId: b.id,
        guestId: faker.helpers.arrayElement(guestIds),
        status: 'SUCCESS' as any,
        requestJson: {},
        responseJson: {},
      };
    });
    await prisma.emehmonLog.createMany({ data: logs });
    process.stdout.write(`.`);
  }
  console.log('\n✅ EmehmonLog done.');

  // 23. RoomStatusHistory (Target 50K)
  console.log('🔹 Seeding 50K RoomStatusHistory...');
  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const histories = Array.from({ length: BATCH_SIZE }).map(() => {
      const room = faker.helpers.arrayElement(sampleRooms);
      return {
        id: faker.string.uuid(),
        tenantId: room.tenantId,
        roomId: room.id,
        oldStatus: RoomStatus.CLEAN,
        newStatus: RoomStatus.DIRTY,
        userId: faker.helpers.arrayElement(userIds),
      };
    });
    await prisma.roomStatusHistory.createMany({ data: histories });
    process.stdout.write(`.`);
  }
  console.log('\n✅ RoomStatusHistory done.');

  // 24. GuestCommunication (Target 50K)
  console.log('🔹 Seeding 50K GuestCommunications...');
  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const comms = Array.from({ length: BATCH_SIZE }).map(() => {
      const guestId = faker.helpers.arrayElement(guestIds);
      return {
        id: faker.string.uuid(),
        tenantId: faker.helpers.arrayElement(tenantIds),
        guestId: guestId,
        type: faker.helpers.arrayElement(Object.values(CommunicationType)),
        channel: faker.helpers.arrayElement(
          Object.values(CommunicationChannel),
        ),
        content: faker.lorem.paragraph(),
      };
    });
    await prisma.guestCommunication.createMany({ data: comms });
    process.stdout.write(`.`);
  }
  console.log('\n✅ GuestCommunications done.');

  // 25. RatePlan (Target 50K)
  console.log('🔹 Seeding 50K RatePlans...');
  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const plans = Array.from({ length: BATCH_SIZE }).map(() => {
      const branch = faker.helpers.arrayElement(sampleBranches);
      return {
        id: faker.string.uuid(),
        tenantId: branch.tenantId,
        branchId: branch.id,
        name: faker.commerce.productName(),
        code: faker.string.alphanumeric(4).toUpperCase(),
      };
    });
    await prisma.ratePlan.createMany({ data: plans, skipDuplicates: true });
    process.stdout.write(`.`);
  }
  console.log('\n✅ RatePlans done.');

  // 26. PriceModifier (Target 50K)
  console.log('🔹 Seeding 50K PriceModifiers...');
  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const mods = Array.from({ length: BATCH_SIZE }).map(() => {
      const type = faker.helpers.arrayElement(sampleRoomTypes);
      return {
        id: faker.string.uuid(),
        tenantId: type.tenantId,
        roomTypeId: type.id,
        name: faker.commerce.productAdjective() + ' Sale',
        percentage: faker.number.float({ min: -20, max: 20 }),
        startDate: faker.date.past(),
        endDate: faker.date.future(),
      };
    });
    await prisma.priceModifier.createMany({ data: mods });
    process.stdout.write(`.`);
  }
  console.log('\n✅ PriceModifiers done.');

  // 27. DiscountContract (Target 50K)
  console.log('🔹 Seeding 50K DiscountContracts...');
  const companyIds = (
    await prisma.company.findMany({ take: 1000, select: { id: true } })
  ).map((c) => c.id);
  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const contracts = Array.from({ length: BATCH_SIZE }).map(() => ({
      id: faker.string.uuid(),
      companyId: faker.helpers.arrayElement(companyIds),
      discountPercent: faker.number.int({ min: 5, max: 30 }),
      startDate: faker.date.past(),
      isActive: true,
    }));
    await prisma.discountContract.createMany({ data: contracts });
    process.stdout.write(`.`);
  }
  console.log('\n✅ DiscountContracts done.');

  // 28. RatePlanRoomType (Target 50K)
  console.log('🔹 Seeding 50K RatePlanRoomTypes...');
  const planIds = await prisma.ratePlan.findMany({
    take: 1000,
    select: { id: true, tenantId: true },
  });
  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const rprts = Array.from({ length: BATCH_SIZE }).map(() => {
      const plan = faker.helpers.arrayElement(planIds);
      const type = faker.helpers.arrayElement(sampleRoomTypes);
      return {
        id: faker.string.uuid(),
        tenantId: plan.tenantId,
        ratePlanId: plan.id,
        roomTypeId: type.id,
        price: faker.number.int({ min: 50, max: 500 }) * 1000,
      };
    });
    await prisma.ratePlanRoomType.createMany({
      data: rprts,
      skipDuplicates: true,
    });
    process.stdout.write(`.`);
  }
  console.log('\n✅ RatePlanRoomTypes done.');

  // 29. RoomStayGuest (Target 50K)
  console.log('🔹 Seeding 50K RoomStayGuests...');
  const stayIds = (
    await prisma.roomStay.findMany({ take: 1000, select: { id: true } })
  ).map((s) => s.id);
  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const rsg = Array.from({ length: BATCH_SIZE }).map(() => ({
      id: faker.string.uuid(),
      roomStayId: faker.helpers.arrayElement(stayIds),
      guestId: faker.helpers.arrayElement(guestIds),
      isPrimary: faker.datatype.boolean(),
    }));
    await prisma.roomStayGuest.createMany({ data: rsg, skipDuplicates: true });
    process.stdout.write(`.`);
  }
  console.log('\n✅ RoomStayGuests done.');

  // 30. MenuItemIngredient (Target 50K)
  console.log('🔹 Seeding 50K MenuItemIngredients...');
  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const mi = Array.from({ length: BATCH_SIZE }).map(() => ({
      id: faker.string.uuid(),
      menuItemId: faker.helpers.arrayElement(sampleMenuItems).id,
      inventoryItemId: faker.helpers.arrayElement(inventoryIds).id,
      quantity: faker.number.int({ min: 1, max: 10 }),
    }));
    await prisma.menuItemIngredient.createMany({
      data: mi,
      skipDuplicates: true,
    });
    process.stdout.write(`.`);
  }
  console.log('\n✅ MenuItemIngredients done.');

  // 31. UserBranch (Target 50K)
  console.log('🔹 Seeding 50K UserBranches (Tenant-Aware)...');

  // Fetch a subset of users with their tenantIds
  const usersWithTenants = await prisma.user.findMany({
    take: 5000,
    select: { id: true, tenantId: true },
  });

  // Group sample branches by tenant for efficient lookup
  const branchesByTenant: Record<string, string[]> = {};
  sampleBranches.forEach((b) => {
    if (!branchesByTenant[b.tenantId]) branchesByTenant[b.tenantId] = [];
    branchesByTenant[b.tenantId].push(b.id);
  });

  for (let i = 0; i < TARGET_COUNT; i += BATCH_SIZE) {
    const ub: any[] = [];
    for (let j = 0; j < BATCH_SIZE; j++) {
      const user = faker.helpers.arrayElement(usersWithTenants);
      const tenantBranches = branchesByTenant[user.tenantId];

      if (tenantBranches && tenantBranches.length > 0) {
        ub.push({
          userId: user.id,
          branchId: faker.helpers.arrayElement(tenantBranches),
          isDefault: faker.datatype.boolean(),
        });
      }
    }

    if (ub.length > 0) {
      await prisma.userBranch.createMany({ data: ub, skipDuplicates: true });
    }
    process.stdout.write(`.`);
  }
  console.log('\n✅ UserBranches done.');

  console.log(
    '\n⭐⭐⭐ MASSIVE SEED COMPLETE: 50K+ per model (where possible) ⭐⭐⭐',
  );
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

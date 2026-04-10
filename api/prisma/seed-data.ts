/**
 * REALISTIC HMS SEED
 * ──────────────────
 * 3 real Uzbek hotels (Tashkent, Samarkand, Bukhara)
 * Each hotel has realistic staff, guests, bookings, finances, and operations.
 * Every single model in the schema is covered.
 */

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
  CommunicationStatus,
  AuditAction,
  RoomStayStatus,
  EmehmonStatus,
  ServiceCategory,
  ServiceRequestStatus,
  SubscriptionStatus,
  CancellationPolicy,
  VisaType,
  SystemLogLevel,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Helpers ────────────────────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function chance(probability: number): boolean {
  return Math.random() < probability;
}

const TODAY = new Date('2025-06-15T12:00:00Z');

// ─── Constants ───────────────────────────────────────────────────────────────

const SALT_ROUNDS = 10;

// ─── Hotel definitions ───────────────────────────────────────────────────────

const HOTELS = [
  {
    name: 'Hilton Tashkent City',
    slug: 'hilton-tashkent-city',
    city: 'Tashkent',
    address: 'Islam Karimov Street 2, Tashkent, Uzbekistan',
    phone: '+998712000100',
    email: 'info@hiltontashkentcity.com',
    website: 'https://www.hilton.com/tashkent',
    taxId: '302845671',
    latitude: 41.2995,
    longitude: 69.2401,
    stars: 5,
    plan: PlanType.ENTERPRISE,
    currency: 'UZS',
    description: {
      en: 'Premier luxury hotel in the heart of Tashkent City',
      uz: 'Toshkent shahri markazidagi zamonaviy mehmonxona',
      ru: 'Первоклассный люкс-отель в центре Ташкента',
    },
  },
  {
    name: 'Mövenpick Samarkand',
    slug: 'movenpick-samarkand',
    city: 'Samarkand',
    address: 'University Boulevard, Silk Road Samarkand, Uzbekistan',
    phone: '+998662230000',
    email: 'hotel.samarkand@movenpick.com',
    website: 'https://movenpick.com/samarkand',
    taxId: '304512389',
    latitude: 39.6542,
    longitude: 66.9597,
    stars: 5,
    plan: PlanType.PREMIUM,
    currency: 'USD',
    description: {
      en: 'World-class hospitality by the historic Silk Road city',
      uz: 'Ipak Yuli shahri yonidagi zamonaviy mehmonxona',
      ru: 'Отель мирового класса у исторического города Шёлкового пути',
    },
  },
  {
    name: 'Mercure Bukhara Old Town',
    slug: 'mercure-bukhara',
    city: 'Bukhara',
    address: 'Samarkand Street 22, Bukhara, Uzbekistan',
    phone: '+998652240050',
    email: 'stay@mercurebukhara.com',
    website: 'https://mercure.com/bukhara',
    taxId: '305678901',
    latitude: 39.7747,
    longitude: 64.4128,
    stars: 4,
    plan: PlanType.STANDARD,
    currency: 'USD',
    description: {
      en: 'Charming boutique hotel steps from the ancient old town',
      uz: 'Qadimiy shahar markazida joylashgan qulay mehmonxona',
      ru: 'Уютный отель в шаге от древнего старого города',
    },
  },
];

// ─── Staff roster per hotel ──────────────────────────────────────────────────

const STAFF_ROSTER = [
  { fullName: 'Dilnoza Yusupova', role: Role.ADMIN, email: 'dilnoza.yusupova' },
  {
    fullName: 'Jahongir Toshmatov',
    role: Role.MANAGER,
    email: 'jahongir.toshmatov',
  },
  {
    fullName: 'Nodira Karimova',
    role: Role.RECEPTIONIST,
    email: 'nodira.karimova',
  },
  {
    fullName: 'Sherzod Rakhimov',
    role: Role.RECEPTIONIST,
    email: 'sherzod.rakhimov',
  },
  {
    fullName: 'Malika Azimova',
    role: Role.HOUSEKEEPER,
    email: 'malika.azimova',
  },
  {
    fullName: 'Bahodir Nazarov',
    role: Role.HOUSEKEEPER,
    email: 'bahodir.nazarov',
  },
  {
    fullName: 'Zulfiya Ergasheva',
    role: Role.KITCHEN,
    email: 'zulfiya.ergasheva',
  },
  { fullName: 'Oybek Mirzayev', role: Role.WAITER, email: 'oybek.mirzayev' },
  {
    fullName: 'Sarvar Tursunov',
    role: Role.MAINTENANCE,
    email: 'sarvar.tursunov',
  },
  {
    fullName: 'Hulkar Ismoilova',
    role: Role.ACCOUNTANT,
    email: 'hulkar.ismoilova',
  },
];

// ─── Realistic guest profiles ─────────────────────────────────────────────────

const GUESTS_DATA = [
  {
    firstName: 'James',
    lastName: 'Harrison',
    citizenship: 'USA',
    gender: Gender.MALE,
    passportSeries: 'US',
    passportNumber: 'A12345678',
    dob: '1985-03-14',
  },
  {
    firstName: 'Emma',
    lastName: 'Schneider',
    citizenship: 'DEU',
    gender: Gender.FEMALE,
    passportSeries: 'DE',
    passportNumber: 'B98765432',
    dob: '1990-07-22',
  },
  {
    firstName: 'Akira',
    lastName: 'Tanaka',
    citizenship: 'JPN',
    gender: Gender.MALE,
    passportSeries: 'JP',
    passportNumber: 'TK3849201',
    dob: '1978-11-05',
  },
  {
    firstName: 'Sophie',
    lastName: 'Dubois',
    citizenship: 'FRA',
    gender: Gender.FEMALE,
    passportSeries: 'FR',
    passportNumber: 'FR8812345',
    dob: '1994-02-18',
  },
  {
    firstName: 'Min',
    lastName: 'Li',
    citizenship: 'CHN',
    gender: Gender.MALE,
    passportSeries: 'CN',
    passportNumber: 'E67812340',
    dob: '1982-09-30',
  },
  {
    firstName: 'Asel',
    lastName: 'Nurova',
    citizenship: 'KAZ',
    gender: Gender.FEMALE,
    passportSeries: 'KZ',
    passportNumber: 'N12349876',
    dob: '1996-05-12',
  },
  {
    firstName: 'Ivan',
    lastName: 'Petrov',
    citizenship: 'RUS',
    gender: Gender.MALE,
    passportSeries: 'RU',
    passportNumber: 'RP8745612',
    dob: '1975-08-08',
  },
  {
    firstName: 'Priya',
    lastName: 'Sharma',
    citizenship: 'IND',
    gender: Gender.FEMALE,
    passportSeries: 'IN',
    passportNumber: 'K9823456',
    dob: '1988-12-25',
  },
  {
    firstName: 'Carlos',
    lastName: 'Ruiz',
    citizenship: 'ESP',
    gender: Gender.MALE,
    passportSeries: 'ES',
    passportNumber: 'XA1234560',
    dob: '1983-06-19',
  },
  {
    firstName: 'Amira',
    lastName: 'Hassan',
    citizenship: 'ARE',
    gender: Gender.FEMALE,
    passportSeries: 'AE',
    passportNumber: 'AE9012348',
    dob: '1991-04-03',
  },
  {
    firstName: 'Thomas',
    lastName: 'Müller',
    citizenship: 'DEU',
    gender: Gender.MALE,
    passportSeries: 'DE',
    passportNumber: 'C11234567',
    dob: '1980-01-15',
  },
  {
    firstName: 'Yuki',
    lastName: 'Yamamoto',
    citizenship: 'JPN',
    gender: Gender.FEMALE,
    passportSeries: 'JP',
    passportNumber: 'YY2345678',
    dob: '1993-10-27',
  },
  {
    firstName: 'Omar',
    lastName: 'Al-Rashid',
    citizenship: 'SAU',
    gender: Gender.MALE,
    passportSeries: 'SA',
    passportNumber: 'SA5678901',
    dob: '1977-07-07',
  },
  {
    firstName: 'Natalie',
    lastName: 'Brown',
    citizenship: 'GBR',
    gender: Gender.FEMALE,
    passportSeries: 'GB',
    passportNumber: 'GB9012345',
    dob: '1989-03-21',
  },
  {
    firstName: 'Sung-jin',
    lastName: 'Park',
    citizenship: 'KOR',
    gender: Gender.MALE,
    passportSeries: 'KR',
    passportNumber: 'M23456789',
    dob: '1986-11-11',
  },
];

// ─── Room configuration ───────────────────────────────────────────────────────

const ROOM_TYPE_CONFIGS = [
  {
    name: 'Standard Double',
    basePrice: 850_000,
    amenities: ['WiFi', 'AC', 'TV', 'Safe'],
    description: 'Comfortable standard room with city view',
  },
  {
    name: 'Deluxe King',
    basePrice: 1_400_000,
    amenities: ['WiFi', 'AC', 'TV', 'Safe', 'Mini Bar', 'Bathtub'],
    description: 'Spacious deluxe room with premium bedding',
  },
  {
    name: 'Executive Suite',
    basePrice: 2_800_000,
    amenities: [
      'WiFi',
      'AC',
      'TV',
      'Safe',
      'Mini Bar',
      'Bathtub',
      'Living Room',
      'Lounge Access',
    ],
    description: 'Elegant suite with separate living area',
  },
  {
    name: 'Presidential Suite',
    basePrice: 6_500_000,
    amenities: [
      'WiFi',
      'AC',
      'TV',
      'Safe',
      'Mini Bar',
      'Jacuzzi',
      'Living Room',
      'Dining Room',
      'Butler Service',
    ],
    description: 'Ultimate luxury suite spanning the top floor',
  },
];

const RATE_PLAN_CONFIGS = [
  {
    name: 'Best Available Rate',
    code: 'BAR',
    includesBreakfast: false,
    cancellationPolicy: CancellationPolicy.FLEXIBLE,
    cancellationHours: 24,
  },
  {
    name: 'Bed & Breakfast',
    code: 'BB',
    includesBreakfast: true,
    cancellationPolicy: CancellationPolicy.FLEXIBLE,
    cancellationHours: 24,
  },
  {
    name: 'Non-Refundable',
    code: 'NR',
    includesBreakfast: false,
    cancellationPolicy: CancellationPolicy.NON_REFUNDABLE,
    cancellationHours: 0,
  },
  {
    name: 'Corporate Rate',
    code: 'CORP',
    includesBreakfast: true,
    cancellationPolicy: CancellationPolicy.MODERATE,
    cancellationHours: 48,
  },
];

// ─── Menu data ────────────────────────────────────────────────────────────────

const MENU_CATEGORIES = [
  {
    name: { en: 'Appetizers', uz: 'Salatlar', ru: 'Закуски' },
    items: [
      {
        name: {
          en: 'Achichuk Salad',
          uz: 'Achichuk salati',
          ru: 'Салат Ачичук',
        },
        price: 35_000,
        calories: 120,
      },
      {
        name: {
          en: 'Tashkent Salad',
          uz: 'Toshkent salati',
          ru: 'Ташкентский салат',
        },
        price: 45_000,
        calories: 180,
      },
      {
        name: {
          en: 'Mozzarella & Tomato',
          uz: 'Mozzarella va pomidor',
          ru: 'Моцарелла с томатом',
        },
        price: 65_000,
        calories: 220,
      },
    ],
  },
  {
    name: { en: 'Soups', uz: "Sho'rvalar", ru: 'Супы' },
    items: [
      {
        name: { en: 'Mastava', uz: 'Mastava', ru: 'Мастава' },
        price: 45_000,
        calories: 280,
      },
      {
        name: { en: "Lagman Sho'rva", uz: "Lag'mon sho'rva", ru: 'Суп Лагман' },
        price: 55_000,
        calories: 380,
      },
      {
        name: {
          en: 'Mushroom Cream Soup',
          uz: "Qo'ziqorin kremli sho'rva",
          ru: 'Крем-суп из грибов',
        },
        price: 60_000,
        calories: 310,
      },
    ],
  },
  {
    name: { en: 'Main Courses', uz: 'Asosiy taomlar', ru: 'Основные блюда' },
    items: [
      {
        name: { en: 'Uzbek Plov', uz: "O'zbek oshi", ru: 'Узбекский плов' },
        price: 95_000,
        calories: 620,
      },
      {
        name: {
          en: 'Tandoor Lamb Chops',
          uz: "Tandir qo'zi qovurg'asi",
          ru: 'Бараньи рёбра тандыр',
        },
        price: 185_000,
        calories: 720,
      },
      {
        name: {
          en: 'Grilled Sea Bass',
          uz: 'Qovurilgan sea bass',
          ru: 'Жареный сибас',
        },
        price: 215_000,
        calories: 480,
      },
      {
        name: {
          en: 'Beef Tenderloin',
          uz: "Mol go'shti filesi",
          ru: 'Говяжья вырезка',
        },
        price: 245_000,
        calories: 560,
      },
    ],
  },
  {
    name: { en: 'Desserts', uz: 'Shirinliklar', ru: 'Десерты' },
    items: [
      {
        name: {
          en: 'Halva Ice Cream',
          uz: 'Halva muzqaymoq',
          ru: 'Мороженое с халвой',
        },
        price: 40_000,
        calories: 350,
      },
      {
        name: { en: 'Baklava', uz: 'Baqlava', ru: 'Пахлава' },
        price: 35_000,
        calories: 420,
      },
      {
        name: {
          en: 'Chocolate Fondant',
          uz: 'Shokoladli fondan',
          ru: 'Шоколадный фондан',
        },
        price: 65_000,
        calories: 480,
      },
    ],
  },
  {
    name: { en: 'Beverages', uz: 'Ichimliklar', ru: 'Напитки' },
    items: [
      {
        name: { en: 'Green Tea', uz: "Ko'k choy", ru: 'Зелёный чай' },
        price: 18_000,
        calories: 5,
      },
      {
        name: {
          en: 'Freshly Squeezed Juice',
          uz: 'Yangi siqilgan sharbat',
          ru: 'Свежевыжатый сок',
        },
        price: 35_000,
        calories: 120,
      },
      {
        name: {
          en: 'Sparkling Water 500ml',
          uz: 'Gazli suv 500ml',
          ru: 'Газированная вода 500мл',
        },
        price: 15_000,
        calories: 0,
      },
    ],
  },
];

// ─── Inventory data ───────────────────────────────────────────────────────────

const INVENTORY_DATA = [
  // MINIBAR
  {
    name: 'Coca-Cola 330ml',
    sku: 'MB-COKE-330',
    unit: 'can',
    quantity: 240,
    minThreshold: 40,
    category: InventoryCategory.MINIBAR,
    purchasePrice: 4_500,
    sellPrice: 18_000,
  },
  {
    name: 'Mineral Water 500ml',
    sku: 'MB-WATER-500',
    unit: 'bottle',
    quantity: 480,
    minThreshold: 60,
    category: InventoryCategory.MINIBAR,
    purchasePrice: 2_500,
    sellPrice: 12_000,
  },
  {
    name: 'Snickers Bar',
    sku: 'MB-SNCK-50',
    unit: 'pcs',
    quantity: 300,
    minThreshold: 50,
    category: InventoryCategory.MINIBAR,
    purchasePrice: 5_000,
    sellPrice: 20_000,
  },
  {
    name: 'Pringles Original 165g',
    sku: 'MB-PRNG-165',
    unit: 'can',
    quantity: 150,
    minThreshold: 30,
    category: InventoryCategory.MINIBAR,
    purchasePrice: 18_000,
    sellPrice: 45_000,
  },
  // HOUSEKEEPING
  {
    name: "Shampoo 30ml (L'Oreal)",
    sku: 'HK-SHMP-30',
    unit: 'bottle',
    quantity: 1200,
    minThreshold: 200,
    category: InventoryCategory.HOUSEKEEPING,
    purchasePrice: 3_500,
    sellPrice: null,
  },
  {
    name: 'Body Wash 30ml',
    sku: 'HK-BODW-30',
    unit: 'bottle',
    quantity: 1200,
    minThreshold: 200,
    category: InventoryCategory.HOUSEKEEPING,
    purchasePrice: 3_000,
    sellPrice: null,
  },
  {
    name: 'Bath Towel (White)',
    sku: 'HK-TOWL-BTH',
    unit: 'pcs',
    quantity: 600,
    minThreshold: 100,
    category: InventoryCategory.HOUSEKEEPING,
    purchasePrice: 45_000,
    sellPrice: null,
  },
  {
    name: 'Toilet Paper Roll',
    sku: 'HK-TLTP-STD',
    unit: 'roll',
    quantity: 2000,
    minThreshold: 300,
    category: InventoryCategory.HOUSEKEEPING,
    purchasePrice: 3_800,
    sellPrice: null,
  },
  // KITCHEN
  {
    name: 'Basmati Rice (1kg)',
    sku: 'KT-RICE-1KG',
    unit: 'kg',
    quantity: 200,
    minThreshold: 30,
    category: InventoryCategory.KITCHEN,
    purchasePrice: 22_000,
    sellPrice: null,
  },
  {
    name: 'Lamb (kg)',
    sku: 'KT-LAMB-KG',
    unit: 'kg',
    quantity: 80,
    minThreshold: 15,
    category: InventoryCategory.KITCHEN,
    purchasePrice: 85_000,
    sellPrice: null,
  },
  {
    name: 'Sunflower Oil (5L)',
    sku: 'KT-OIL-5L',
    unit: 'litre',
    quantity: 60,
    minThreshold: 10,
    category: InventoryCategory.KITCHEN,
    purchasePrice: 55_000,
    sellPrice: null,
  },
  // MAINTENANCE
  {
    name: 'LED Bulb E27 (10W)',
    sku: 'MT-BULB-E27',
    unit: 'pcs',
    quantity: 150,
    minThreshold: 20,
    category: InventoryCategory.MAINTENANCE,
    purchasePrice: 12_000,
    sellPrice: null,
  },
  {
    name: 'Door Lock Battery AA',
    sku: 'MT-BATT-AA',
    unit: 'pcs',
    quantity: 400,
    minThreshold: 50,
    category: InventoryCategory.MAINTENANCE,
    purchasePrice: 3_000,
    sellPrice: null,
  },
];

// ─── Hotel services ───────────────────────────────────────────────────────────

const HOTEL_SERVICES_DATA = [
  {
    name: 'Airport Transfer (Standard Sedan)',
    description: 'One-way transfer from Tashkent International Airport',
    category: ServiceCategory.TRANSPORT,
    basePrice: 280_000,
  },
  {
    name: 'Airport Transfer (Business Class)',
    description: 'Premium vehicle airport pickup/dropoff',
    category: ServiceCategory.TRANSPORT,
    basePrice: 550_000,
  },
  {
    name: 'Laundry – Express (4h)',
    description: 'Express wash, dry, fold service',
    category: ServiceCategory.LAUNDRY,
    basePrice: 80_000,
  },
  {
    name: 'Dry Cleaning – Suit',
    description: 'Professional suit dry cleaning',
    category: ServiceCategory.LAUNDRY,
    basePrice: 180_000,
  },
  {
    name: 'Swedish Massage 60min',
    description: 'Full-body relaxation massage at the spa',
    category: ServiceCategory.SPA,
    basePrice: 480_000,
  },
  {
    name: 'Couples Massage 90min',
    description: 'Side-by-side relaxation experience',
    category: ServiceCategory.SPA,
    basePrice: 950_000,
  },
  {
    name: 'City Sightseeing Tour (Half Day)',
    description: '4-hour guided city tour, private vehicle included',
    category: ServiceCategory.CONCIERGE,
    basePrice: 850_000,
  },
  {
    name: 'In-Room Dining Delivery',
    description: 'Menu item delivery to guest room',
    category: ServiceCategory.FOOD_BEVERAGE,
    basePrice: 30_000,
  },
];

// ─── Companies ────────────────────────────────────────────────────────────────

const COMPANIES_DATA = [
  {
    name: 'UzbekTelecom JSC',
    taxId: 'UZ302000001',
    contactPerson: 'Alisher Umarov',
    email: 'hr@uzbektelecom.uz',
    phone: '+998712000001',
  },
  {
    name: 'Silk Road Tourism LLC',
    taxId: 'UZ302000002',
    contactPerson: 'Feruza Mirzayeva',
    email: 'feruza@srtourism.uz',
    phone: '+998712000002',
  },
  {
    name: 'Gazprom Uzbekistan',
    taxId: 'UZ302000003',
    contactPerson: 'Dmitry Volkov',
    email: 'd.volkov@gazprom-uz.com',
    phone: '+998712000003',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SEED
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('🚀 Starting realistic HMS seed...\n');

  // ── Password hash ──────────────────────────────────────────────────────────
  const password = await bcrypt.hash('password123', SALT_ROUNDS);

  // ── 1. SUPER ADMIN TENANT ──────────────────────────────────────────────────
  console.log('👤 Creating Super Admin...');
  let systemTenant = await prisma.tenant.findUnique({
    where: { slug: 'system' },
  });
  if (!systemTenant) {
    systemTenant = await prisma.tenant.create({
      data: {
        name: 'HMS Platform',
        slug: 'system',
        isActive: true,
        planType: PlanType.ENTERPRISE,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        maxBranches: 999,
        maxUsers: 9999,
      },
    });
  }

  let superAdmin = await prisma.user.findUnique({
    where: { email: 'super@hms.uz' },
  });
  if (!superAdmin) {
    superAdmin = await prisma.user.create({
      data: {
        email: 'super@hms.uz',
        password,
        fullName: 'HMS Super Admin',
        role: Role.SUPER_ADMIN,
        tenantId: systemTenant.id,
      },
    });
  }

  // ── 2. SYSTEM LOG (covers SystemLog model) ─────────────────────────────────
  await prisma.systemLog.createMany({
    data: [
      {
        level: SystemLogLevel.INFO,
        context: 'SEED',
        message: 'Realistic seed started',
        metadata: { version: '2.0' },
        timestamp: new Date(),
      },
      {
        level: SystemLogLevel.INFO,
        context: 'AUTH',
        message: 'Super admin account verified',
        timestamp: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  // ── 3. HOTELS LOOP ─────────────────────────────────────────────────────────
  for (const hotelDef of HOTELS) {
    console.log(`\n🏨 Seeding: ${hotelDef.name}`);
    const hotelSlug = hotelDef.slug;

    // ── Tenant ──────────────────────────────────────────────────────────────
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: hotelSlug },
    });
    if (existingTenant) {
      console.log(`   ↳ Already exists, skipping.`);
      continue;
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: hotelDef.name,
        slug: hotelSlug,
        isActive: true,
        planType: hotelDef.plan,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionStart: new Date('2024-01-01'),
        subscriptionEnd: new Date('2026-01-01'),
        maxBranches: 3,
        maxUsers: 50,
        lastPaymentDate: addDays(TODAY, -30),
        nextBillingDate: addDays(TODAY, 30),
        notes: `Onboarded ${hotelDef.city} property`,
      },
    });
    console.log(`   ✅ Tenant: ${tenant.id}`);

    // ── Branch ──────────────────────────────────────────────────────────────
    const branch = await prisma.branch.create({
      data: {
        tenantId: tenant.id,
        name: hotelDef.name,
        slug: hotelSlug,
        legalName: `${hotelDef.name} LLC`,
        address: hotelDef.address,
        phone: hotelDef.phone,
        email: hotelDef.email,
        website: hotelDef.website,
        taxId: hotelDef.taxId,
        latitude: hotelDef.latitude,
        longitude: hotelDef.longitude,
        starRating: hotelDef.stars,
        currency: hotelDef.currency,
        description: hotelDef.description,
        isActive: true,
        isSetupCompleted: true,
        isFeatured: true,
        checkInTime: '14:00',
        checkOutTime: '12:00',
        tags: ['luxury', 'pool', 'spa', 'restaurant', 'conference'],
        gallery: [
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945',
          'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4',
        ],
        logoUrl: `https://logo.clearbit.com/${hotelDef.slug}.com`,
      },
    });
    console.log(`   ✅ Branch: ${branch.id}`);

    // ── Staff (Users) ────────────────────────────────────────────────────────
    console.log('   👥 Creating staff...');
    const staffUsers: Record<string, string> = {}; // role → userId

    const slugSuffix = hotelSlug.split('-').pop()!;

    for (const staffDef of STAFF_ROSTER) {
      const email = `${staffDef.email}.${slugSuffix}@hms.uz`;
      const user = await prisma.user.create({
        data: {
          email,
          password,
          fullName: staffDef.fullName,
          role: staffDef.role,
          tenantId: tenant.id,
          isActive: true,
        },
      });

      await prisma.userBranch.create({
        data: {
          userId: user.id,
          branchId: branch.id,
          isDefault: true,
          role: staffDef.role,
        },
      });

      staffUsers[staffDef.role] = user.id;
      if (!staffUsers[`${staffDef.role}_list`]) {
        staffUsers[`${staffDef.role}_list`] = user.id;
      }
    }

    // Collect all staff IDs
    const allStaffIds = await prisma.user
      .findMany({ where: { tenantId: tenant.id }, select: { id: true } })
      .then((u) => u.map((x) => x.id));

    const receptionist = allStaffIds[2];
    const housekeeper = allStaffIds[4];
    const maintenance = allStaffIds[8];
    const accountant = allStaffIds[9];
    const manager = allStaffIds[1];

    // ── Guests ───────────────────────────────────────────────────────────────
    console.log('   👤 Creating guests...');
    const guestIds: string[] = [];

    for (const gd of GUESTS_DATA) {
      const guest = await prisma.guest.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          firstName: gd.firstName,
          lastName: gd.lastName,
          phone: `+1-555-${randomBetween(1000, 9999)}`,
          citizenship: gd.citizenship,
          passportSeries: gd.passportSeries,
          passportNumber: `${gd.passportNumber}-${slugSuffix}`,
          dateOfBirth: new Date(gd.dob),
          gender: gd.gender,
          visaType: pick([VisaType.TOURIST, VisaType.BUSINESS]),
          passportIssueDate: new Date('2020-01-01'),
          passportExpiryDate: new Date('2030-01-01'),
        },
      });
      guestIds.push(guest.id);
    }

    // ── Companies & Discount Contracts ───────────────────────────────────────
    console.log('   🏢 Creating companies...');
    const companyIds: string[] = [];
    for (const cd of COMPANIES_DATA) {
      const company = await prisma.company.create({
        data: {
          tenantId: tenant.id,
          name: cd.name,
          taxId: `${cd.taxId}-${slugSuffix}`,
          contactPerson: cd.contactPerson,
          email: cd.email,
          phone: cd.phone,
          isActive: true,
        },
      });
      companyIds.push(company.id);

      // Discount contract for each company
      await prisma.discountContract.create({
        data: {
          companyId: company.id,
          discountPercent: pick([10, 15, 20, 25]),
          startDate: new Date('2024-01-01'),
          endDate: new Date('2026-12-31'),
          isActive: true,
          description: `Corporate agreement with ${cd.name}`,
        },
      });
    }

    // ── Room Types ───────────────────────────────────────────────────────────
    console.log('   🛏  Creating room types...');
    const roomTypeIds: string[] = [];

    for (const rtc of ROOM_TYPE_CONFIGS) {
      const rt = await prisma.roomType.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          name: rtc.name,
          basePrice: rtc.basePrice,
          description: rtc.description,
          amenities: rtc.amenities,
          images: [
            'https://images.unsplash.com/photo-1611892440504-42a792e24d32',
            'https://images.unsplash.com/photo-1590490360182-c33d57733427',
          ],
        },
      });
      roomTypeIds.push(rt.id);
    }

    // ── Rate Plans ───────────────────────────────────────────────────────────
    console.log('   💰 Creating rate plans...');
    const ratePlanIds: string[] = [];

    for (let i = 0; i < RATE_PLAN_CONFIGS.length; i++) {
      const rpc = RATE_PLAN_CONFIGS[i];
      const rp = await prisma.ratePlan.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          name: rpc.name,
          code: `${rpc.code}-${slugSuffix.toUpperCase()}`,
          includesBreakfast: rpc.includesBreakfast,
          includesWifi: true,
          cancellationPolicy: rpc.cancellationPolicy,
          cancellationHours: rpc.cancellationHours,
          isActive: true,
          validFrom: new Date('2024-01-01'),
          validTo: new Date('2026-12-31'),
        },
      });
      ratePlanIds.push(rp.id);

      // RatePlanRoomType — every rate plan applies to every room type with different prices
      for (let j = 0; j < roomTypeIds.length; j++) {
        const multiplier = [1.0, 1.0, 1.15, 0.88, 0.95][i] ?? 1.0;
        await prisma.ratePlanRoomType.create({
          data: {
            tenantId: tenant.id,
            ratePlanId: rp.id,
            roomTypeId: roomTypeIds[j],
            price: Math.round(ROOM_TYPE_CONFIGS[j].basePrice * multiplier),
          },
        });
      }
    }

    // ── Price Modifiers ───────────────────────────────────────────────────────
    const modifierTemplates = [
      {
        name: 'Nowruz Holiday Rate',
        percentage: 20,
        start: '2025-03-20',
        end: '2025-03-25',
      },
      {
        name: 'Summer Peak Season',
        percentage: 15,
        start: '2025-06-01',
        end: '2025-08-31',
      },
      {
        name: 'Off-Season Discount',
        percentage: -20,
        start: '2025-12-01',
        end: '2026-02-28',
      },
    ];

    for (const rtId of roomTypeIds) {
      for (const mod of modifierTemplates) {
        await prisma.priceModifier.create({
          data: {
            tenantId: tenant.id,
            roomTypeId: rtId,
            name: mod.name,
            percentage: mod.percentage,
            startDate: new Date(mod.start),
            endDate: new Date(mod.end),
            isActive: true,
          },
        });
      }
    }
    console.log('   ✅ Rate plans & price modifiers created');

    // ── Rooms ────────────────────────────────────────────────────────────────
    console.log('   🚪 Creating rooms...');
    const roomIds: string[] = [];
    const roomMap: Record<string, { id: string; typeId: string }[]> = {};

    // Layout: floors 2–8, 6 rooms per floor = 42 rooms total
    let roomCounter = 0;
    for (let floor = 2; floor <= 8; floor++) {
      for (let roomNum = 1; roomNum <= 6; roomNum++) {
        const typeIndex = Math.min(
          Math.floor(roomNum / 2),
          roomTypeIds.length - 1,
        );
        const typeId = roomTypeIds[typeIndex];
        const number = `${floor}0${roomNum}`;
        const status = pick([
          RoomStatus.CLEAN,
          RoomStatus.CLEAN,
          RoomStatus.CLEAN,
          RoomStatus.DIRTY,
          RoomStatus.INSPECTED,
        ]);

        const room = await prisma.room.create({
          data: {
            tenantId: tenant.id,
            branchId: branch.id,
            typeId,
            number,
            floor,
            capacity: typeIndex === 3 ? 4 : typeIndex === 2 ? 3 : 2,
            status,
            isOccupied: status === RoomStatus.DIRTY,
            images: [
              'https://images.unsplash.com/photo-1611892440504-42a792e24d32',
              'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf',
            ],
            lastCleanedAt: addDays(TODAY, -1),
            lastInspectedAt: addDays(TODAY, -2),
          },
        });
        roomIds.push(room.id);
        if (!roomMap[typeId]) roomMap[typeId] = [];
        roomMap[typeId].push({ id: room.id, typeId });
        roomCounter++;
      }
    }
    console.log(`   ✅ ${roomCounter} rooms created`);

    // ── Room Status History ──────────────────────────────────────────────────
    for (const roomId of roomIds.slice(0, 10)) {
      await prisma.roomStatusHistory.create({
        data: {
          tenantId: tenant.id,
          roomId,
          oldStatus: RoomStatus.DIRTY,
          newStatus: RoomStatus.CLEAN,
          userId: housekeeper,
          notes: 'Cleaned after guest checkout',
        },
      });
    }

    // ── Inventory Items ───────────────────────────────────────────────────────
    console.log('   📦 Creating inventory...');
    const inventoryIds: string[] = [];

    for (const inv of INVENTORY_DATA) {
      const item = await prisma.inventoryItem.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          name: inv.name,
          sku: `${inv.sku}-${slugSuffix.toUpperCase()}`,
          unit: inv.unit,
          quantity: inv.quantity,
          minThreshold: inv.minThreshold,
          category: inv.category,
          purchasePrice: inv.purchasePrice ?? undefined,
          sellPrice: inv.sellPrice ?? undefined,
          lastUpdatedById: manager,
        },
      });
      inventoryIds.push(item.id);

      // Stock log entry for initial stock
      await prisma.stockLog.create({
        data: {
          itemId: item.id,
          tenantId: tenant.id,
          staffId: manager,
          change: inv.quantity,
          reason: StockUpdateReason.RESTOCKED,
          note: 'Initial stock on property opening',
        },
      });
    }

    // ── Restaurant Categories & Menu Items ────────────────────────────────────
    console.log('   🍽  Creating restaurant menu...');
    const menuItemIds: string[] = [];

    for (const cat of MENU_CATEGORIES) {
      const category = await prisma.restaurantCategory.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          name: cat.name,
        },
      });

      for (const item of cat.items) {
        const menuItem = await prisma.restaurantMenuItem.create({
          data: {
            tenantId: tenant.id,
            branchId: branch.id,
            categoryId: category.id,
            name: item.name,
            description: {
              en: `Delicious ${item.name.en} prepared by our chef`,
              uz: `Oshpazimiz tayyorlagan ${item.name.uz}`,
              ru: `Блюдо ${item.name.ru} от нашего шеф-повара`,
            },
            price: item.price,
            calories: item.calories,
            imageUrl:
              'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
          },
        });
        menuItemIds.push(menuItem.id);

        // MenuItemIngredient — link kitchen items to menu items (for complex dishes)
        const kitchenItems = inventoryIds.filter(
          (_, i) => INVENTORY_DATA[i]?.category === InventoryCategory.KITCHEN,
        );
        if (kitchenItems.length > 0) {
          const ingredientCount = randomBetween(
            1,
            Math.min(2, kitchenItems.length),
          );
          const usedIngredients = pickN(kitchenItems, ingredientCount);
          for (const invId of usedIngredients) {
            await prisma.menuItemIngredient.upsert({
              where: {
                menuItemId_inventoryItemId: {
                  menuItemId: menuItem.id,
                  inventoryItemId: invId,
                },
              },
              update: {},
              create: {
                menuItemId: menuItem.id,
                inventoryItemId: invId,
                quantity: randomBetween(1, 3),
              },
            });
          }
        }
      }
    }

    // ── Hotel Services ────────────────────────────────────────────────────────
    console.log('   🛎  Creating hotel services...');
    const hotelServiceIds: string[] = [];

    for (const svc of HOTEL_SERVICES_DATA) {
      const hs = await prisma.hotelService.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          name: svc.name,
          description: svc.description,
          category: svc.category,
          basePrice: svc.basePrice,
          currency: Currency.UZS,
          isActive: true,
        },
      });
      hotelServiceIds.push(hs.id);
    }

    // ── BOOKINGS + ROOM STAYS + FOLIOS + PAYMENTS ────────────────────────────
    console.log('   📋 Creating bookings, stays, folios, payments...');

    // Scenario: 12 realistic booking scenarios
    const bookingScenarios = [
      // Past completed stays
      {
        guestIdx: 0,
        checkInOffset: -30,
        nights: 3,
        status: BookingStatus.CHECKED_OUT,
        source: BookingSource.BOOKING_COM,
        ratePlanIdx: 0,
        roomTypeIdx: 0,
        hasCompany: false,
      },
      {
        guestIdx: 1,
        checkInOffset: -20,
        nights: 2,
        status: BookingStatus.CHECKED_OUT,
        source: BookingSource.WEBSITE,
        ratePlanIdx: 1,
        roomTypeIdx: 1,
        hasCompany: false,
      },
      {
        guestIdx: 2,
        checkInOffset: -15,
        nights: 5,
        status: BookingStatus.CHECKED_OUT,
        source: BookingSource.PHONE,
        ratePlanIdx: 2,
        roomTypeIdx: 0,
        hasCompany: false,
      },
      {
        guestIdx: 3,
        checkInOffset: -10,
        nights: 7,
        status: BookingStatus.CHECKED_OUT,
        source: BookingSource.EXPEDIA,
        ratePlanIdx: 3,
        roomTypeIdx: 2,
        hasCompany: true,
      },
      // Current stays
      {
        guestIdx: 4,
        checkInOffset: -2,
        nights: 4,
        status: BookingStatus.CHECKED_IN,
        source: BookingSource.WALK_IN,
        ratePlanIdx: 0,
        roomTypeIdx: 1,
        hasCompany: false,
      },
      {
        guestIdx: 5,
        checkInOffset: -1,
        nights: 3,
        status: BookingStatus.CHECKED_IN,
        source: BookingSource.TELEGRAM,
        ratePlanIdx: 1,
        roomTypeIdx: 0,
        hasCompany: false,
      },
      {
        guestIdx: 6,
        checkInOffset: -3,
        nights: 6,
        status: BookingStatus.CHECKED_IN,
        source: BookingSource.BOOKING_COM,
        ratePlanIdx: 2,
        roomTypeIdx: 2,
        hasCompany: true,
      },
      // Upcoming arrivals
      {
        guestIdx: 7,
        checkInOffset: 1,
        nights: 2,
        status: BookingStatus.CONFIRMED,
        source: BookingSource.WEBSITE,
        ratePlanIdx: 0,
        roomTypeIdx: 0,
        hasCompany: false,
      },
      {
        guestIdx: 8,
        checkInOffset: 3,
        nights: 3,
        status: BookingStatus.CONFIRMED,
        source: BookingSource.BOOKING_COM,
        ratePlanIdx: 1,
        roomTypeIdx: 1,
        hasCompany: false,
      },
      {
        guestIdx: 9,
        checkInOffset: 7,
        nights: 4,
        status: BookingStatus.CONFIRMED,
        source: BookingSource.PHONE,
        ratePlanIdx: 3,
        roomTypeIdx: 3,
        hasCompany: true,
      },
      // Cancelled / No-show
      {
        guestIdx: 10,
        checkInOffset: -5,
        nights: 2,
        status: BookingStatus.CANCELLED,
        source: BookingSource.EXPEDIA,
        ratePlanIdx: 0,
        roomTypeIdx: 0,
        hasCompany: false,
      },
      {
        guestIdx: 11,
        checkInOffset: -3,
        nights: 1,
        status: BookingStatus.NO_SHOW,
        source: BookingSource.WALK_IN,
        ratePlanIdx: 0,
        roomTypeIdx: 0,
        hasCompany: false,
      },
    ];

    for (let bi = 0; bi < bookingScenarios.length; bi++) {
      const sc = bookingScenarios[bi];
      const guestId = guestIds[sc.guestIdx % guestIds.length];
      const checkIn = addDays(TODAY, sc.checkInOffset);
      const checkOut = addDays(checkIn, sc.nights);
      const ratePlanId = ratePlanIds[sc.ratePlanIdx % ratePlanIds.length];
      const companyId = sc.hasCompany ? pick(companyIds) : undefined;
      const roomTypeId = roomTypeIds[sc.roomTypeIdx % roomTypeIds.length];
      const roomsForType = roomMap[roomTypeId] ?? Object.values(roomMap).flat();
      const room = roomsForType[bi % roomsForType.length];
      const dailyRate =
        ROOM_TYPE_CONFIGS[sc.roomTypeIdx % ROOM_TYPE_CONFIGS.length].basePrice;
      const totalRoomCharge = dailyRate * sc.nights;

      // Booking
      const booking = await prisma.booking.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          primaryGuestId: guestId,
          checkIn,
          checkOut,
          status: sc.status,
          source: sc.source,
          ratePlanId,
          companyId,
        },
      });

      // Room Stay
      const stayStatus =
        sc.status === BookingStatus.CHECKED_OUT
          ? RoomStayStatus.CHECKED_OUT
          : sc.status === BookingStatus.CHECKED_IN
            ? RoomStayStatus.CHECKED_IN
            : sc.status === BookingStatus.CANCELLED
              ? RoomStayStatus.CANCELLED
              : RoomStayStatus.RESERVED;

      const roomStay = await prisma.roomStay.create({
        data: {
          tenantId: tenant.id,
          bookingId: booking.id,
          roomId: room?.id ?? null,
          startDate: checkIn,
          endDate: checkOut,
          dailyRate,
          currency: Currency.UZS,
          adultsCount: 2,
          childrenCount: chance(0.3) ? 1 : 0,
          status: stayStatus,
        },
      });

      // RoomStayGuest
      await prisma.roomStayGuest.create({
        data: { roomStayId: roomStay.id, guestId, isPrimary: true },
      });

      // Add second guest occasionally
      if (chance(0.4) && guestIds.length > 1) {
        const secondGuestId = guestIds[(sc.guestIdx + 1) % guestIds.length];
        await prisma.roomStayGuest.upsert({
          where: {
            roomStayId_guestId: {
              roomStayId: roomStay.id,
              guestId: secondGuestId,
            },
          },
          update: {},
          create: {
            roomStayId: roomStay.id,
            guestId: secondGuestId,
            isPrimary: false,
          },
        });
      }

      // E-Mehmon Log
      const emehmonStatus =
        sc.status === BookingStatus.CHECKED_OUT ||
        sc.status === BookingStatus.CHECKED_IN
          ? EmehmonStatus.SUCCESS
          : sc.status === BookingStatus.CANCELLED
            ? EmehmonStatus.FAILED
            : EmehmonStatus.PENDING;

      await prisma.emehmonLog.create({
        data: {
          tenantId: tenant.id,
          bookingId: booking.id,
          guestId,
          status: emehmonStatus,
          requestJson: { action: 'register', bookingId: booking.id, guestId },
          responseJson:
            emehmonStatus === EmehmonStatus.SUCCESS
              ? {
                  success: true,
                  registrationId: `REG-${booking.id.slice(0, 8).toUpperCase()}`,
                }
              : { success: false, error: 'Cancelled booking' },
          regSlipNumber:
            emehmonStatus === EmehmonStatus.SUCCESS
              ? `SLP-${booking.id.slice(0, 8).toUpperCase()}`
              : null,
          registeredAt:
            emehmonStatus === EmehmonStatus.SUCCESS ? checkIn : null,
          expiresAt: emehmonStatus === EmehmonStatus.SUCCESS ? checkOut : null,
          retryCount: emehmonStatus === EmehmonStatus.FAILED ? 2 : 0,
        },
      });

      // Guest Communication
      const commTypes: CommunicationType[] =
        sc.status === BookingStatus.CHECKED_OUT
          ? [
              CommunicationType.BOOKING_CONFIRMATION,
              CommunicationType.PRE_ARRIVAL,
              CommunicationType.WELCOME,
              CommunicationType.POST_STAY_SURVEY,
            ]
          : sc.status === BookingStatus.CHECKED_IN
            ? [
                CommunicationType.BOOKING_CONFIRMATION,
                CommunicationType.PRE_ARRIVAL,
                CommunicationType.WELCOME,
              ]
            : [CommunicationType.BOOKING_CONFIRMATION];

      for (const commType of commTypes) {
        await prisma.guestCommunication.create({
          data: {
            tenantId: tenant.id,
            guestId,
            bookingId: booking.id,
            type: commType,
            channel: pick([
              CommunicationChannel.EMAIL,
              CommunicationChannel.TELEGRAM,
              CommunicationChannel.SMS,
            ]),
            subject:
              commType === CommunicationType.BOOKING_CONFIRMATION
                ? `Booking Confirmation – ${hotelDef.name}`
                : commType === CommunicationType.PRE_ARRIVAL
                  ? `Your arrival at ${hotelDef.name} – Useful Info`
                  : commType === CommunicationType.WELCOME
                    ? `Welcome to ${hotelDef.name}!`
                    : `How was your stay at ${hotelDef.name}?`,
            content: `Dear Guest, thank you for choosing ${hotelDef.name}. Your booking details are enclosed.`,
            status: CommunicationStatus.DELIVERED,
            sentAt: addDays(checkIn, -2),
            deliveredAt: addDays(checkIn, -2),
          },
        });
      }

      // Skip folio / payments for cancelled & no-show
      if (
        sc.status === BookingStatus.CANCELLED ||
        sc.status === BookingStatus.NO_SHOW
      )
        continue;

      // Folio
      const folioStatus =
        sc.status === BookingStatus.CHECKED_OUT
          ? FolioStatus.CLOSED
          : FolioStatus.OPEN;
      const folio = await prisma.folio.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          bookingId: booking.id,
          status: folioStatus,
          isPrimary: true,
        },
      });

      // Folio Items
      const vatRate = 0.12;
      const tourismTaxRate = 0.05;

      // Room charge
      const roomTax = Math.round(totalRoomCharge * vatRate);
      await prisma.folioItem.create({
        data: {
          tenantId: tenant.id,
          folioId: folio.id,
          description: `Room ${room?.id ? 'occupancy' : 'charge'} – ${sc.nights} night(s)`,
          quantity: sc.nights,
          unitPrice: dailyRate,
          taxRate: vatRate,
          taxAmount: roomTax,
          totalAmount: totalRoomCharge + roomTax,
          currency: Currency.UZS,
          type: ChargeType.ROOM_CHARGE,
          taxType: TaxType.VAT,
          source: FolioItemSource.SYSTEM,
          staffId: receptionist,
        },
      });

      // Tourism tax (per person per night)
      const tourismBase = 50_000 * sc.nights * 2;
      const tourismTaxAmt = Math.round(tourismBase * tourismTaxRate);
      await prisma.folioItem.create({
        data: {
          tenantId: tenant.id,
          folioId: folio.id,
          description: `Tourism tax – ${sc.nights} night(s) × 2 guests`,
          quantity: sc.nights,
          unitPrice: 50_000,
          taxRate: tourismTaxRate,
          taxAmount: tourismTaxAmt,
          totalAmount: tourismBase + tourismTaxAmt,
          currency: Currency.UZS,
          type: ChargeType.TOURIST_TAX,
          taxType: TaxType.TOURISM_TAX,
          source: FolioItemSource.AUTO_POST,
          isTaxExempt: false,
          staffId: receptionist,
        },
      });

      // Minibar charge (if multi-night)
      if (sc.nights >= 2) {
        const minibarAmount = 85_000;
        const minibarTax = Math.round(minibarAmount * vatRate);
        await prisma.folioItem.create({
          data: {
            tenantId: tenant.id,
            folioId: folio.id,
            description: 'Minibar consumption',
            quantity: 1,
            unitPrice: minibarAmount,
            taxRate: vatRate,
            taxAmount: minibarTax,
            totalAmount: minibarAmount + minibarTax,
            currency: Currency.UZS,
            type: ChargeType.MINIBAR,
            taxType: TaxType.VAT,
            source: FolioItemSource.MANUAL,
            staffId: receptionist,
          },
        });
      }

      // Restaurant charge (for checked-in and checked-out)
      if (chance(0.7)) {
        const restAmount = randomBetween(80, 350) * 1000;
        const restTax = Math.round(restAmount * vatRate);
        await prisma.folioItem.create({
          data: {
            tenantId: tenant.id,
            folioId: folio.id,
            description: 'Restaurant & bar charges',
            quantity: 1,
            unitPrice: restAmount,
            taxRate: vatRate,
            taxAmount: restTax,
            totalAmount: restAmount + restTax,
            currency: Currency.UZS,
            type: ChargeType.RESTAURANT,
            taxType: TaxType.VAT,
            source: FolioItemSource.SERVICE_MODULE,
            staffId: receptionist,
          },
        });
      }

      // Payment
      const totalCharged =
        totalRoomCharge + roomTax + tourismBase + tourismTaxAmt;
      const paymentMethod = pick([
        PaymentMethod.CASH,
        PaymentMethod.VISA_MASTERCARD,
        PaymentMethod.CLICK,
        PaymentMethod.UZCARD,
        PaymentMethod.PAYME,
      ]);
      const paymentCurrency = chance(0.7)
        ? Currency.UZS
        : pick([Currency.USD, Currency.EUR]);
      const exchangeRates: Record<string, number> = {
        USD: 12_700,
        EUR: 13_800,
        RUB: 138,
        UZS: 1,
      };
      const exchangeRate = exchangeRates[paymentCurrency] ?? 1;
      const amountInForeign =
        paymentCurrency !== Currency.UZS
          ? Math.round(totalCharged / exchangeRate)
          : null;

      await prisma.payment.create({
        data: {
          tenantId: tenant.id,
          folioId: folio.id,
          amount: amountInForeign ?? totalCharged,
          currency: paymentCurrency,
          exchangeRate: paymentCurrency !== Currency.UZS ? exchangeRate : null,
          amountInLocal: paymentCurrency !== Currency.UZS ? totalCharged : null,
          method: paymentMethod,
          status:
            sc.status === BookingStatus.CHECKED_OUT
              ? PaymentStatus.COMPLETED
              : PaymentStatus.PENDING,
          transactionRef: `TXN${booking.id.slice(0, 8).toUpperCase()}`,
          receiptNumber: `RCP${String(bi + 1).padStart(6, '0')}`,
          staffId: accountant,
        },
      });

      // Hotel Service Request (for some bookings)
      if (chance(0.5) && hotelServiceIds.length > 0) {
        const service = hotelServiceIds[bi % hotelServiceIds.length];
        await prisma.hotelServiceRequest.create({
          data: {
            tenantId: tenant.id,
            branchId: branch.id,
            serviceId: service,
            bookingId: booking.id,
            status:
              sc.status === BookingStatus.CHECKED_OUT
                ? ServiceRequestStatus.COMPLETED
                : ServiceRequestStatus.REQUESTED,
            quantity: 1,
            totalAmount:
              HOTEL_SERVICES_DATA[bi % HOTEL_SERVICES_DATA.length].basePrice,
            notes: 'Guest requested during check-in',
            scheduledFor: addDays(checkIn, 1),
            staffId: receptionist,
          },
        });

        // FolioItem for the service
        const svcDef = HOTEL_SERVICES_DATA[bi % HOTEL_SERVICES_DATA.length];
        if (
          sc.status === BookingStatus.CHECKED_OUT ||
          sc.status === BookingStatus.CHECKED_IN
        ) {
          await prisma.folioItem.create({
            data: {
              tenantId: tenant.id,
              folioId: folio.id,
              description: svcDef.name,
              quantity: 1,
              unitPrice: svcDef.basePrice,
              taxRate: vatRate,
              taxAmount: Math.round(svcDef.basePrice * vatRate),
              totalAmount: Math.round(svcDef.basePrice * (1 + vatRate)),
              currency: Currency.UZS,
              type:
                svcDef.category === ServiceCategory.TRANSPORT
                  ? ChargeType.TRANSPORT
                  : svcDef.category === ServiceCategory.SPA
                    ? ChargeType.SPA
                    : svcDef.category === ServiceCategory.LAUNDRY
                      ? ChargeType.LAUNDRY
                      : ChargeType.CONCIERGE,
              taxType: TaxType.VAT,
              source: FolioItemSource.SERVICE_MODULE,
              staffId: receptionist,
            },
          });
        }
      }

      // Restaurant Orders (for in-house guests)
      if (
        sc.status === BookingStatus.CHECKED_IN ||
        sc.status === BookingStatus.CHECKED_OUT
      ) {
        const orderCount = randomBetween(1, 3);
        for (let oi = 0; oi < orderCount; oi++) {
          const orderStatus =
            sc.status === BookingStatus.CHECKED_OUT
              ? pick([
                  RestaurantOrderStatus.PAID,
                  RestaurantOrderStatus.PAID,
                  RestaurantOrderStatus.SERVED,
                ])
              : pick([
                  RestaurantOrderStatus.PREPARING,
                  RestaurantOrderStatus.SERVED,
                  RestaurantOrderStatus.PAID,
                ]);

          const orderTotal = randomBetween(80, 400) * 1000;
          const order = await prisma.restaurantOrder.create({
            data: {
              tenantId: tenant.id,
              branchId: branch.id,
              tableNumber: pick(['T1', 'T2', 'T3', 'T4', 'T5', 'VIP1', 'BAR1']),
              status: orderStatus,
              bookingId: chance(0.5) ? booking.id : null,
              totalAmount: orderTotal,
            },
          });

          // Order Items
          const itemCount = randomBetween(2, 4);
          const selectedMenuItems = pickN(menuItemIds, itemCount);
          for (const menuItemId of selectedMenuItems) {
            const qty = randomBetween(1, 2);
            const price = randomBetween(20, 200) * 1000;
            await prisma.restaurantOrderItem.create({
              data: {
                orderId: order.id,
                menuItemId,
                quantity: qty,
                price,
                notes: chance(0.2)
                  ? pick(['No chili', 'Extra sauce', 'Well done', 'Less salt'])
                  : null,
              },
            });
          }
        }
      }

      // Audit log for booking creation
      await prisma.auditLog.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          userId: receptionist,
          action: AuditAction.CREATE,
          entityType: 'Booking',
          entityId: booking.id,
          newData: { guestId, checkIn, checkOut, status: sc.status },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 HMS Front Desk App',
        },
      });
    }

    // ── Housekeeping Tasks ────────────────────────────────────────────────────
    console.log('   🧹 Creating housekeeping tasks...');
    const housekeepingScenarios = [
      {
        roomIdx: 0,
        type: HousekeepingTaskType.CHECKOUT_CLEAN,
        status: TaskStatus.COMPLETED,
        priority: Priority.HIGH,
      },
      {
        roomIdx: 1,
        type: HousekeepingTaskType.DAILY_CLEAN,
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.MEDIUM,
      },
      {
        roomIdx: 2,
        type: HousekeepingTaskType.TURNDOWN,
        status: TaskStatus.PENDING,
        priority: Priority.LOW,
      },
      {
        roomIdx: 3,
        type: HousekeepingTaskType.DEEP_CLEAN,
        status: TaskStatus.PENDING,
        priority: Priority.MEDIUM,
      },
      {
        roomIdx: 4,
        type: HousekeepingTaskType.INSPECTION,
        status: TaskStatus.COMPLETED,
        priority: Priority.HIGH,
      },
      {
        roomIdx: 5,
        type: HousekeepingTaskType.DAILY_CLEAN,
        status: TaskStatus.PENDING,
        priority: Priority.MEDIUM,
      },
      {
        roomIdx: 6,
        type: HousekeepingTaskType.CHECKOUT_CLEAN,
        status: TaskStatus.COMPLETED,
        priority: Priority.HIGH,
      },
      {
        roomIdx: 7,
        type: HousekeepingTaskType.TURNDOWN,
        status: TaskStatus.PENDING,
        priority: Priority.LOW,
      },
    ];

    for (const hs of housekeepingScenarios) {
      const roomId = roomIds[hs.roomIdx % roomIds.length];
      await prisma.housekeepingTask.create({
        data: {
          tenantId: tenant.id,
          roomId,
          assigneeId: housekeeper,
          createdById: manager,
          completedById:
            hs.status === TaskStatus.COMPLETED ? housekeeper : null,
          completedAt:
            hs.status === TaskStatus.COMPLETED ? addDays(TODAY, -1) : null,
          status: hs.status,
          priority: hs.priority,
          taskType: hs.type,
          scheduledFor:
            hs.status === TaskStatus.COMPLETED ? addDays(TODAY, -1) : TODAY,
          notes:
            hs.type === HousekeepingTaskType.DEEP_CLEAN
              ? 'Guest checked out, deep clean required'
              : null,
        },
      });
    }

    // ── Maintenance Tickets ───────────────────────────────────────────────────
    console.log('   🔧 Creating maintenance tickets...');
    const maintenanceScenarios = [
      {
        roomIdx: 0,
        description: 'Air conditioning unit making unusual noise',
        status: TicketStatus.RESOLVED,
      },
      {
        roomIdx: 2,
        description: 'Bathroom faucet dripping, needs washer replacement',
        status: TicketStatus.IN_PROGRESS,
      },
      {
        roomIdx: 5,
        description: 'TV remote not working, possible IR sensor issue',
        status: TicketStatus.OPEN,
      },
      {
        roomIdx: 8,
        description: 'Light bulb in wardrobe blown (E27 socket)',
        status: TicketStatus.RESOLVED,
      },
      {
        roomIdx: 12,
        description: 'Door lock battery low, keycard intermittent',
        status: TicketStatus.OPEN,
      },
    ];

    for (const mt of maintenanceScenarios) {
      const roomId = roomIds[mt.roomIdx % roomIds.length];
      await prisma.maintenanceTicket.create({
        data: {
          tenantId: tenant.id,
          roomId,
          description: mt.description,
          reportedBy: housekeeper,
          status: mt.status,
          userId: maintenance,
          resolvedAt:
            mt.status === TicketStatus.RESOLVED ? addDays(TODAY, -1) : null,
        },
      });

      // Audit log for maintenance ticket
      await prisma.auditLog.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          userId: maintenance,
          action:
            mt.status === TicketStatus.RESOLVED
              ? AuditAction.UPDATE
              : AuditAction.CREATE,
          entityType: 'MaintenanceTicket',
          entityId: roomId,
          newData: { description: mt.description, status: mt.status },
          ipAddress: '192.168.1.2',
          userAgent: 'HMS Mobile App v2.1',
        },
      });
    }

    // ── Additional stock usage logs ───────────────────────────────────────────
    const minibarItems = inventoryIds.filter(
      (_, i) => INVENTORY_DATA[i]?.category === InventoryCategory.MINIBAR,
    );
    for (const itemId of minibarItems) {
      await prisma.stockLog.create({
        data: {
          itemId,
          tenantId: tenant.id,
          staffId: housekeeper,
          change: -randomBetween(2, 8),
          reason: StockUpdateReason.USED_IN_ROOM,
          note: 'Daily minibar restock reconciliation',
        },
      });
    }

    // ── Reviews ───────────────────────────────────────────────────────────────
    console.log('   ⭐ Creating reviews...');
    const reviewData = [
      {
        guestIdx: 0,
        rating: 5,
        comment:
          'Exceptional service and stunning views. The staff went above and beyond for our stay.',
      },
      {
        guestIdx: 1,
        rating: 4,
        comment:
          'Beautiful hotel, great location. Room was spotless. Breakfast was delicious.',
      },
      {
        guestIdx: 2,
        rating: 5,
        comment:
          'Perfect for business travel. Fast WiFi, excellent meeting facilities, and superb dining.',
      },
      {
        guestIdx: 3,
        rating: 3,
        comment:
          'Good hotel overall, but check-in took a while. Room was clean and comfortable.',
      },
      {
        guestIdx: 4,
        rating: 5,
        comment:
          'Absolutely loved the spa facilities. Will definitely return on our next Uzbekistan trip!',
      },
    ];

    for (const rv of reviewData) {
      await prisma.review.create({
        data: {
          branchId: branch.id,
          guestId: guestIds[rv.guestIdx % guestIds.length],
          rating: rv.rating,
          comment: rv.comment,
          isVerified: true,
          isActive: true,
        },
      });
    }

    // ── Audit Logs (login/logout events) ─────────────────────────────────────
    for (const staffId of allStaffIds) {
      await prisma.auditLog.createMany({
        data: [
          {
            tenantId: tenant.id,
            branchId: branch.id,
            userId: staffId,
            action: AuditAction.LOGIN,
            entityType: 'User',
            entityId: staffId,
            ipAddress: '192.168.1.10',
            userAgent: 'HMS Desktop App v3.0',
          },
        ],
      });
    }

    console.log(`   ✅ ${hotelDef.name} fully seeded!`);
  }

  // ── Final system logs ────────────────────────────────────────────────────────
  await prisma.systemLog.createMany({
    data: [
      {
        level: SystemLogLevel.INFO,
        context: 'SEED',
        message: 'Realistic seed completed successfully',
        metadata: {
          hotels: HOTELS.length,
          totalGuests: GUESTS_DATA.length * HOTELS.length,
        },
        timestamp: new Date(),
      },
      {
        level: SystemLogLevel.WARN,
        context: 'DATABASE',
        message: 'High connection pool usage during seed',
        metadata: { poolSize: 10, used: 8 },
        timestamp: new Date(),
      },
    ],
  });

  console.log('\n' + '═'.repeat(60));
  console.log('✅ REALISTIC SEED COMPLETE');
  console.log('═'.repeat(60));
  console.log('\n📊 Summary per hotel:');
  console.log('  ├─ 10 staff members with UserBranch assignments');
  console.log('  ├─ 15 international guests');
  console.log('  ├─ 3 companies + discount contracts');
  console.log('  ├─ 4 room types + 42 rooms across 7 floors');
  console.log('  ├─ 4 rate plans + rate-plan-room-type combos');
  console.log('  ├─ 3 price modifiers per room type');
  console.log('  ├─ 13 inventory items + stock logs');
  console.log('  ├─ 5 restaurant categories + 16 menu items + ingredients');
  console.log('  ├─ 8 hotel services');
  console.log('  ├─ 12 bookings (past/current/upcoming/cancelled)');
  console.log('  ├─ Room stays + RoomStayGuests + E-Mehmon logs');
  console.log('  ├─ Folios + folio items (room, tax, minibar, service)');
  console.log('  ├─ Multi-currency payments');
  console.log('  ├─ Restaurant orders + order items');
  console.log('  ├─ Hotel service requests');
  console.log('  ├─ 8 housekeeping tasks');
  console.log('  ├─ 5 maintenance tickets');
  console.log('  ├─ Guest communications (all lifecycle types)');
  console.log('  ├─ Room status history');
  console.log('  ├─ Reviews (1-5 star realistic comments)');
  console.log('  └─ Audit logs + system logs');
  console.log('\n🔐 Login: super@hms.uz / password123');
  console.log('🔐 Staff: <name>.<hotel-suffix>@hms.uz / password123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

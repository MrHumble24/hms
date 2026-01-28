import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { toString as toQrString } from 'qrcode';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateRoomTypeDto,
  UpdateRoomTypeDto,
  CreateRoomDto,
  UpdateRoomDto,
  CreateRatePlanDto,
  CreateRatePlanRoomTypeDto,
  CreatePriceModifierDto,
  UpdatePriceModifierDto,
  BulkQrDownloadDto,
} from './dto/rooms.dto.js';
import { RoomStatus } from '@prisma/client';
import { getTenantContext } from '../common/tenant-context.js';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  private getContext() {
    const context = getTenantContext();
    if (!context?.branchId || !context?.tenantId) {
      throw new BadRequestException('Branch and Tenant context are required');
    }
    return context;
  }

  // --- Room Type Methods ---

  async createRoomType(createRoomTypeDto: CreateRoomTypeDto) {
    const { branchId, tenantId } = this.getContext();
    return this.prisma.roomType.create({
      data: {
        ...createRoomTypeDto,
        branchId,
        tenantId,
        amenities: createRoomTypeDto.amenities || [],
      },
    });
  }

  async findAllRoomTypes() {
    const { branchId, tenantId } = this.getContext();
    return this.prisma.roomType.findMany({
      where: { branchId, tenantId },
      include: { rooms: true },
    });
  }

  async findOneRoomType(id: string) {
    const { branchId, tenantId } = this.getContext();
    const roomType = await this.prisma.roomType.findFirst({
      where: { id, branchId, tenantId },
      include: { rooms: true },
    });
    if (!roomType) throw new NotFoundException('Room Type not found');
    return roomType;
  }

  async updateRoomType(id: string, updateRoomTypeDto: UpdateRoomTypeDto) {
    const { tenantId } = this.getContext();
    return this.prisma.roomType.update({
      where: { id, tenantId }, // ID is unique, and findOneRoomType already validated scope
      data: updateRoomTypeDto,
    });
  }

  async removeRoomType(id: string) {
    const { tenantId } = this.getContext();
    return this.prisma.roomType.delete({
      where: { id, tenantId },
      include: {
        branch: true,
        tenant: true,
      }, // ID is unique, and findOneRoomType already validated scope
    });
  }

  // --- Room Methods ---

  async createRoom(createRoomDto: CreateRoomDto) {
    const { branchId, tenantId } = this.getContext();

    // Check if room number already exists in this branch
    const existingRoom = await this.prisma.room.findFirst({
      where: {
        number: createRoomDto.number,
        branchId,
        tenantId,
      },
    });
    if (existingRoom)
      throw new ConflictException('Room number already exists in this branch');

    // Check if room type exists in this branch
    await this.findOneRoomType(createRoomDto.typeId);

    return this.prisma.room.create({
      data: {
        ...createRoomDto,
        branchId,
        tenantId,
        status: RoomStatus.CLEAN,
      },
    });
  }

  async findAllRooms(params: {
    skip?: number;
    take?: number;
    search?: string;
    typeId?: string;
    status?: string;
  }) {
    const { branchId, tenantId } = this.getContext();
    const where: any = { branchId, tenantId };

    if (params.typeId) {
      where.typeId = params.typeId;
    }

    if (params.status && params.status !== 'ALL') {
      where.status = params.status as RoomStatus;
    }

    if (params.search) {
      where.number = { contains: params.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.room.findMany({
        where,
        skip: params.skip || 0,
        take: params.take || 10,
        include: { type: true },
        orderBy: { number: 'asc' },
      }),
      this.prisma.room.count({ where }),
    ]);

    return { data, total };
  }

  async findOneRoom(id: string) {
    const { branchId, tenantId } = this.getContext();
    const room = await this.prisma.room.findFirst({
      where: { id, branchId, tenantId },
      include: { type: true },
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async updateRoom(id: string, updateRoomDto: UpdateRoomDto) {
    const room = await this.findOneRoom(id); // Ensure room exists and is scoped

    if (updateRoomDto.number && updateRoomDto.number !== room.number) {
      const { branchId, tenantId } = this.getContext();
      const existingRoom = await this.prisma.room.findFirst({
        where: {
          number: updateRoomDto.number,
          branchId,
          tenantId,
        },
      });
      if (existingRoom)
        throw new ConflictException(
          'Room number already exists in this branch',
        );
    }

    if (updateRoomDto.typeId) {
      await this.findOneRoomType(updateRoomDto.typeId); // Ensure new room type exists and is scoped
    }

    const { tenantId } = this.getContext();
    return this.prisma.room.update({
      where: { id: room.id, tenantId }, // ID is unique, and findOneRoom already validated scope
      data: {
        ...updateRoomDto,
        status: updateRoomDto.status as RoomStatus,
      },
    });
  }

  async removeRoom(id: string) {
    const { tenantId } = this.getContext();
    return this.prisma.room.delete({
      where: { id, tenantId }, // ID is unique, and findOneRoom already validated scope
    });
  }

  // --- Rate Plan Methods ---

  async createRatePlan(dto: CreateRatePlanDto) {
    const { branchId, tenantId } = this.getContext();
    return this.prisma.ratePlan.create({
      data: {
        ...dto,
        branchId,
        tenantId,
      },
    });
  }

  async findAllRatePlans() {
    const { branchId, tenantId } = this.getContext();
    return this.prisma.ratePlan.findMany({
      where: { branchId, tenantId },
      include: { roomTypes: { include: { roomType: true } } },
    });
  }

  async findOneRatePlan(id: string) {
    const { branchId, tenantId } = this.getContext();
    const plan = await this.prisma.ratePlan.findFirst({
      where: { id, branchId, tenantId },
      include: { roomTypes: { include: { roomType: true } } },
    });
    if (!plan) throw new NotFoundException('Rate Plan not found');
    return plan;
  }

  async addRoomTypeToRatePlan(dto: CreateRatePlanRoomTypeDto) {
    // Validate rate plan and room type exist and are scoped
    await this.findOneRatePlan(dto.ratePlanId);
    await this.findOneRoomType(dto.roomTypeId);

    // Check for existing entry to prevent duplicates
    const existing = await this.prisma.ratePlanRoomType.findFirst({
      where: {
        ratePlanId: dto.ratePlanId,
        roomTypeId: dto.roomTypeId,
      },
    });

    if (existing) {
      throw new ConflictException(
        'This room type is already associated with this rate plan.',
      );
    }

    const { tenantId } = this.getContext();
    return this.prisma.ratePlanRoomType.create({
      data: { ...dto, tenantId },
    });
  }

  async removeRoomTypeFromRatePlan(ratePlanId: string, roomTypeId: string) {
    await this.findOneRatePlan(ratePlanId);
    await this.findOneRoomType(roomTypeId);

    const result = await this.prisma.ratePlanRoomType.deleteMany({
      where: {
        ratePlanId,
        roomTypeId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(
        'Room type not found in the specified rate plan.',
      );
    }
    return { message: 'Room type removed from rate plan successfully' };
  }

  // --- Price Modifier Methods ---

  async createPriceModifier(dto: CreatePriceModifierDto) {
    const { branchId, tenantId } = this.getContext();
    // Validate that either percentage OR fixedValue is provided, not both
    if (
      (dto.percentage && dto.fixedValue) ||
      (!dto.percentage && !dto.fixedValue)
    ) {
      throw new ConflictException(
        'Provide either percentage or fixedValue, not both',
      );
    }

    // Verify room type exists in this branch
    await this.findOneRoomType(dto.roomTypeId);

    return this.prisma.priceModifier.create({
      data: {
        name: dto.name,
        roomTypeId: dto.roomTypeId,
        tenantId,
        percentage: dto.percentage || null,
        fixedValue: dto.fixedValue || null,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isActive: dto.isActive ?? true,
      },
      include: { roomType: true },
    });
  }

  async findAllPriceModifiers(roomTypeId?: string) {
    const { branchId, tenantId } = this.getContext();
    return this.prisma.priceModifier.findMany({
      where: {
        tenantId,
        roomType: { branchId },
        ...(roomTypeId ? { roomTypeId } : {}),
      },
      include: { roomType: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOnePriceModifier(id: string) {
    const { branchId, tenantId } = this.getContext();
    const modifier = await this.prisma.priceModifier.findFirst({
      where: {
        id,
        tenantId,
        roomType: { branchId },
      },
      include: { roomType: true },
    });
    if (!modifier) throw new NotFoundException('Price Modifier not found');
    return modifier;
  }

  async updatePriceModifier(id: string, dto: UpdatePriceModifierDto) {
    const { tenantId } = this.getContext();
    await this.findOnePriceModifier(id);

    // Validate that both percentage AND fixedValue are not provided together
    if (dto.percentage && dto.fixedValue) {
      throw new ConflictException(
        'Provide either percentage or fixedValue, not both',
      );
    }

    return this.prisma.priceModifier.update({
      where: { id, tenantId },
      data: {
        name: dto.name,
        percentage: dto.percentage !== undefined ? dto.percentage : undefined,
        fixedValue: dto.fixedValue !== undefined ? dto.fixedValue : undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        isActive: dto.isActive,
      },
      include: { roomType: true },
    });
  }

  async removePriceModifier(id: string) {
    const { tenantId } = this.getContext();
    await this.findOnePriceModifier(id);
    return this.prisma.priceModifier.delete({ where: { id, tenantId } });
  }

  async getEffectivePrice(roomTypeId: string, date: Date) {
    const roomType = await this.findOneRoomType(roomTypeId);
    let effectivePrice = Number(roomType.basePrice);

    // Find active modifiers for this date
    const { tenantId } = this.getContext();
    const modifiers = await this.prisma.priceModifier.findMany({
      where: {
        roomTypeId,
        tenantId,
        isActive: true,
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });

    // Apply all matching modifiers
    for (const modifier of modifiers) {
      if (modifier.percentage) {
        effectivePrice += effectivePrice * (Number(modifier.percentage) / 100);
      } else if (modifier.fixedValue) {
        effectivePrice += Number(modifier.fixedValue);
      }
    }

    return {
      roomType: roomType.name,
      basePrice: Number(roomType.basePrice),
      effectivePrice: Math.round(effectivePrice * 100) / 100,
      appliedModifiers: modifiers.map((m) => ({
        name: m.name,
        percentage: m.percentage,
        fixedValue: m.fixedValue ? Number(m.fixedValue) : null,
      })),
    };
  }

  // --- Dashboard ---

  async getDashboard() {
    const { branchId, tenantId } = this.getContext();
    const now = new Date();

    const rooms = await this.prisma.room.findMany({
      where: { branchId, tenantId },
      include: {
        type: true,
        roomStays: {
          where: {
            status: { in: ['RESERVED', 'CHECKED_IN'] },
            startDate: { lte: now },
            endDate: { gte: now },
          },
          include: { booking: { include: { primaryGuest: true } } },
        },
        tasks: {
          where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
          include: { assignee: true },
        },
        maintenance: {
          where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
        },
      },
      orderBy: { number: 'asc' },
    });

    return rooms.map((room) => {
      const { roomStays, ...rest } = room;
      return {
        ...rest,
        bookings: roomStays.map((rs) => ({
          ...rs.booking,
          guest: rs.booking.primaryGuest,
        })),
      };
    });
  }

  async bulkDownloadQrCodes(dto: BulkQrDownloadDto) {
    const { branchId, tenantId } = this.getContext();

    const rooms = await this.prisma.room.findMany({
      where: {
        tenantId,
        branchId,
        ...(dto.roomIds?.length ? { id: { in: dto.roomIds } } : {}),
      },
      orderBy: { number: 'asc' },
    });

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    const passThrough = new PassThrough();
    archive.pipe(passThrough);

    // Process in sequence to avoid memory issues and ensure zip is valid
    (async () => {
      try {
        for (const room of rooms) {
          const url = `${dto.baseUrl}/restaurant/public/menu?room=${room.id}&tenant=${tenantId}&branch=${branchId}`;
          const svg = await this.generateQrSvg(url, room.number);
          archive.append(svg, { name: `room-${room.number}.svg` });
        }
        await archive.finalize();
      } catch (err) {
        passThrough.destroy(err);
      }
    })();

    return passThrough;
  }

  private async generateQrSvg(url: string, roomNumber: string) {
    const qrSvg = await toQrString(url, {
      type: 'svg',
      margin: 2,
      width: 400,
      color: {
        dark: '#2d3436',
        light: '#ffffff',
      },
    });

    const cleanQrSvg = qrSvg.replace(/<\?xml.*?\?>/, '');

    return `
<svg width="600" height="850" viewBox="0 0 600 850" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="15" />
      <feOffset dx="0" dy="15" result="offsetblur" />
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.15" />
      </feComponentTransfer>
      <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Premium Card Background -->
  <rect x="25" y="25" width="550" height="800" rx="60" fill="white" filter="url(#shadow)" stroke="#f1f2f6" stroke-width="1" />
  
  <!-- Subtle Header Area -->
  <rect x="75" y="75" width="450" height="450" rx="40" fill="#f9f9fb" />
  
  <!-- Centered QR Code -->
  <g transform="translate(100, 100)">
    ${cleanQrSvg}
  </g>

  <!-- Typography -->
  <text x="300" y="600" text-anchor="middle" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="36" font-weight="900" fill="#2d3436" letter-spacing="1.5">RESTAURANT MENU</text>
  <text x="300" y="645" text-anchor="middle" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="22" fill="#636e72" font-weight="500">Scan to browse &amp; order</text>
  
  <!-- Professional Footer Pill -->
  <rect x="50" y="710" width="500" height="100" rx="50" fill="#2d3436" />
  <text x="300" y="778" text-anchor="middle" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="60" font-weight="900" fill="#ffffff" letter-spacing="3">ROOM ${roomNumber}</text>

  <!-- Aesthetic Detail -->
  <circle cx="300" cy="560" r="5" fill="#ff7675" />
</svg>`.trim();
  }
}

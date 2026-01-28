import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateGuestDto, UpdateGuestDto } from './dto/guests.dto.js';
import { getTenantContext } from '../common/tenant-context.js';

@Injectable()
export class GuestsService {
  constructor(private prisma: PrismaService) {}

  private getContext() {
    const context = getTenantContext();
    if (!context?.tenantId) {
      throw new BadRequestException('Tenant context is required');
    }
    return context;
  }

  async create(createGuestDto: CreateGuestDto) {
    const { tenantId } = this.getContext();
    const { passportSeries, passportNumber } = createGuestDto;

    // Check for duplicate passport within this tenant
    const existingGuest = await this.prisma.guest.findUnique({
      where: {
        tenantId_passportSeries_passportNumber: {
          tenantId,
          passportSeries,
          passportNumber,
        },
      },
    });

    if (existingGuest) {
      throw new ConflictException('Guest with this passport already exists');
    }

    return this.prisma.guest.create({
      data: {
        ...createGuestDto,
        tenantId,
        dateOfBirth: new Date(createGuestDto.dateOfBirth),
        dateOfEntry: createGuestDto.dateOfEntry
          ? new Date(createGuestDto.dateOfEntry)
          : null,
        passportIssueDate: createGuestDto.passportIssueDate
          ? new Date(createGuestDto.passportIssueDate)
          : null,
        passportExpiryDate: createGuestDto.passportExpiryDate
          ? new Date(createGuestDto.passportExpiryDate)
          : null,
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    search?: string;
    branchId?: string;
  }) {
    const { tenantId } = this.getContext();
    const where: any = { tenantId };

    // Optionally filter by guests who have bookings in a specific branch
    if (params.branchId) {
      where.primaryBookings = {
        some: {
          branchId: params.branchId,
        },
      };
    }

    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { patronymic: { contains: params.search, mode: 'insensitive' } },
        { passportNumber: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.guest.findMany({
        where,
        skip: params.skip || 0,
        take: params.take || 10,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.guest.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: string) {
    const { tenantId } = this.getContext();
    const guest = await this.prisma.guest.findUnique({
      where: { id, tenantId },
    });
    if (!guest) throw new NotFoundException('Guest not found');
    return guest;
  }

  async update(id: string, updateGuestDto: UpdateGuestDto) {
    const { tenantId } = this.getContext();
    const guest = await this.findOne(id);

    if (updateGuestDto.passportSeries || updateGuestDto.passportNumber) {
      const series = updateGuestDto.passportSeries ?? guest.passportSeries;
      const number = updateGuestDto.passportNumber ?? guest.passportNumber;

      const existingGuest = await this.prisma.guest.findUnique({
        where: {
          tenantId_passportSeries_passportNumber: {
            tenantId,
            passportSeries: series,
            passportNumber: number,
          },
        },
      });

      if (existingGuest && existingGuest.id !== id) {
        throw new ConflictException(
          'Another guest with this passport already exists',
        );
      }
    }

    return this.prisma.guest.update({
      where: { id, tenantId },
      data: {
        ...updateGuestDto,
        dateOfBirth: updateGuestDto.dateOfBirth
          ? new Date(updateGuestDto.dateOfBirth)
          : undefined,
        dateOfEntry: updateGuestDto.dateOfEntry
          ? new Date(updateGuestDto.dateOfEntry)
          : undefined,
        passportIssueDate: updateGuestDto.passportIssueDate
          ? new Date(updateGuestDto.passportIssueDate)
          : undefined,
        passportExpiryDate: updateGuestDto.passportExpiryDate
          ? new Date(updateGuestDto.passportExpiryDate)
          : undefined,
      },
    });
  }

  async remove(id: string) {
    const { tenantId } = this.getContext();
    await this.findOne(id);
    return this.prisma.guest.delete({
      where: { id, tenantId },
    });
  }
}

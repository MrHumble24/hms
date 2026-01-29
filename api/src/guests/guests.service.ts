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
    if (!context?.branchId) {
      throw new BadRequestException('Branch context is required');
    }
    return context;
  }

  async create(createGuestDto: CreateGuestDto) {
    const { tenantId, branchId } = this.getContext();
    const { passportSeries, passportNumber } = createGuestDto;

    // Check for duplicate passport within this tenant/branch
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
        branchId,
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
    const { tenantId, branchId: contextBranchId } = this.getContext();

    const where: any = { tenantId };

    // If there's a search term, allow searching across all branches for this tenant
    // so receptionists can find existing profiles.
    // Otherwise, strictly isolate to the current branch.
    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { patronymic: { contains: params.search, mode: 'insensitive' } },
        { passportNumber: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    } else {
      where.branchId = contextBranchId;
    }

    const [data, total] = await Promise.all([
      this.prisma.guest.findMany({
        where,
        skip: params.skip || 0,
        take: params.take || 10,
        orderBy: { createdAt: 'desc' },
        include: { branch: true },
      }),
      this.prisma.guest.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: string) {
    const { tenantId, branchId } = this.getContext();
    const guest = await this.prisma.guest.findFirst({
      where: { id, tenantId }, // Allow finding from any branch for the "Pull" logic
      include: {
        branch: true,
        primaryBookings: {
          include: {
            roomStays: { include: { room: true } },
          },
        },
      },
    });
    if (!guest) throw new NotFoundException('Guest not found');
    return guest;
  }

  async lookupGlobal(passportSeries: string, passportNumber: string) {
    const { tenantId } = this.getContext();
    const guest = await this.prisma.guest.findUnique({
      where: {
        tenantId_passportSeries_passportNumber: {
          tenantId,
          passportSeries,
          passportNumber,
        },
      },
      include: {
        branch: true,
      },
    });

    return guest;
  }

  async pullToBranch(id: string) {
    const { tenantId, branchId } = this.getContext();

    // Reassign guest to current branch
    return this.prisma.guest.update({
      where: { id, tenantId },
      data: { branchId },
    });
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

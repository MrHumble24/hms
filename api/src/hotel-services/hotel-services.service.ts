import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { getTenantContext } from '../common/tenant-context.js';
import {
  CreateHotelServiceDto,
  CreateServiceRequestDto,
  UpdateServiceRequestDto,
  UpdateHotelServiceDto,
} from './dto/hotel-services.dto.js';
import {
  FolioItemSource,
  ChargeType,
  ServiceRequestStatus,
} from '@prisma/client';

@Injectable()
export class HotelServicesService {
  constructor(private prisma: PrismaService) {}

  private getContext() {
    const context = getTenantContext();
    if (!context?.tenantId || !context?.branchId) {
      throw new BadRequestException('Context required');
    }
    return context;
  }

  // --- Catalog Methods ---

  async createService(dto: CreateHotelServiceDto) {
    const { tenantId, branchId } = this.getContext();
    return (this.prisma as any).hotelService.create({
      data: {
        ...dto,
        tenantId,
        branchId,
      },
    });
  }

  async findAllServices() {
    const { branchId } = this.getContext();
    return (this.prisma as any).hotelService.findMany({
      where: { branchId },
    });
  }

  async updateService(id: string, dto: UpdateHotelServiceDto) {
    return (this.prisma as any).hotelService.update({
      where: { id },
      data: dto,
    });
  }

  // --- Request/Order Methods ---

  async createRequest(dto: CreateServiceRequestDto) {
    const { tenantId, branchId } = this.getContext();

    const service = await (this.prisma as any).hotelService.findUnique({
      where: { id: dto.serviceId },
    });

    if (!service) throw new NotFoundException('Service not found');

    const totalAmount = Number(service.basePrice) * (dto.quantity || 1);

    return (this.prisma as any).hotelServiceRequest.create({
      data: {
        ...dto,
        tenantId,
        branchId,
        totalAmount,
        status: ServiceRequestStatus.REQUESTED,
      },
      include: { service: true },
    });
  }

  async findAllRequests() {
    const { branchId } = this.getContext();
    return (this.prisma as any).hotelServiceRequest.findMany({
      where: { branchId },
      include: { service: true, booking: { include: { primaryGuest: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateRequestStatus(id: string, dto: UpdateServiceRequestDto) {
    const { tenantId } = this.getContext();

    // 1. Find request
    const request = await (this.prisma as any).hotelServiceRequest.findUnique({
      where: { id },
      include: { service: true, booking: { include: { folios: true } } },
    });

    if (!request) throw new NotFoundException('Service request not found');

    // 2. Update status
    const updated = await (this.prisma as any).hotelServiceRequest.update({
      where: { id },
      data: dto,
    });

    // 3. If COMPLETED, post to Folio automatically!
    if (
      dto.status === ServiceRequestStatus.COMPLETED &&
      request.status !== ServiceRequestStatus.COMPLETED
    ) {
      const primaryFolio =
        request.booking.folios.find((f: any) => f.isPrimary) ||
        request.booking.folios[0];

      if (primaryFolio) {
        await this.prisma.folioItem.create({
          data: {
            tenantId,
            folioId: primaryFolio.id,
            description: `${request.service.name} (x${request.quantity})`,
            quantity: request.quantity,
            unitPrice: request.service.basePrice,
            totalAmount: request.totalAmount,
            type: this.mapCategoryToChargeType(request.service.category) as any,
            source: FolioItemSource.SERVICE_MODULE as any,
          } as any,
        });
      }
    }

    return updated;
  }

  private mapCategoryToChargeType(category: string): ChargeType {
    switch (category) {
      case 'LAUNDRY':
        return ChargeType.LAUNDRY;
      case 'SPA':
        return 'SPA' as any;
      case 'TRANSPORT':
        return 'TRANSPORT' as any;
      case 'CONCIERGE':
        return 'CONCIERGE' as any;
      default:
        return 'OTHER_SERVICE' as any;
    }
  }
}

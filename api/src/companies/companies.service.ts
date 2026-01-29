import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  CreateDiscountContractDto,
  UpdateDiscountContractDto,
} from './dto/companies.dto.js';
import { getTenantContext } from '../common/tenant-context.js';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  private getContext() {
    const context = getTenantContext();
    if (!context?.tenantId || !context?.branchId) {
      throw new BadRequestException(
        'Tenant and Branch context are required!!!',
      );
    }
    return context;
  }

  async create(createCompanyDto: CreateCompanyDto) {
    const { tenantId } = this.getContext();

    const existing = await this.prisma.company.findUnique({
      where: {
        tenantId_taxId: {
          tenantId,
          taxId: createCompanyDto.taxId,
        },
      },
    });
    if (existing)
      throw new ConflictException(
        'Company with this Tax ID (INN) already exists',
      );

    return this.prisma.company.create({
      data: {
        ...createCompanyDto,
        tenantId,
      },
    });
  }

  async findAll() {
    const { tenantId, branchId } = this.getContext();
    return this.prisma.company.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: {
            bookings: { where: { branchId } }, // Count bookings for current branch only
            contracts: true,
          },
        },
        contracts: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const { tenantId, branchId } = this.getContext();
    const company = await this.prisma.company.findUnique({
      where: { id, tenantId },
      include: {
        contracts: {
          orderBy: { startDate: 'desc' },
        },
        bookings: {
          where: { branchId }, // Filter bookings by current branch
          include: {
            primaryGuest: true,
            roomStays: { include: { room: { include: { type: true } } } },
          },
          orderBy: { checkIn: 'desc' },
          take: 20,
        },
      },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    const { tenantId } = this.getContext();
    await this.findOne(id);

    if (updateCompanyDto.taxId) {
      const existing = await this.prisma.company.findUnique({
        where: {
          tenantId_taxId: {
            tenantId,
            taxId: updateCompanyDto.taxId,
          },
        },
      });
      if (existing && existing.id !== id)
        throw new ConflictException(
          'Tax ID (INN) already in use by another company',
        );
    }

    return this.prisma.company.update({
      where: { id, tenantId },
      data: updateCompanyDto,
    });
  }

  async remove(id: string) {
    const { tenantId } = this.getContext();
    const company = await this.prisma.company.findUnique({
      where: { id, tenantId },
      include: { _count: { select: { bookings: true } } },
    });

    if (!company) throw new NotFoundException('Company not found');

    if (company._count.bookings > 0) {
      throw new ConflictException(
        'Cannot delete company with linked bookings. Deactivate it instead.',
      );
    }

    return this.prisma.company.delete({
      where: { id, tenantId },
    });
  }

  // Contracts
  async createContract(companyId: string, dto: CreateDiscountContractDto) {
    await this.findOne(companyId);
    return this.prisma.discountContract.create({
      data: { ...dto, companyId },
    });
  }

  async updateContract(id: string, dto: UpdateDiscountContractDto) {
    return this.prisma.discountContract.update({
      where: { id },
      data: dto,
    });
  }

  async removeContract(id: string) {
    return this.prisma.discountContract.delete({
      where: { id },
    });
  }
}

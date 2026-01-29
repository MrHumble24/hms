import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CompaniesService } from './companies.service.js';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  CreateDiscountContractDto,
  UpdateDiscountContractDto,
} from './dto/companies.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ACCOUNTANT')
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  findAll() {
    return this.companiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ACCOUNTANT')
  update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  remove(@Param('id') id: string) {
    return this.companiesService.remove(id);
  }

  // Discount Contracts
  @Post(':id/contracts')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ACCOUNTANT')
  createContract(
    @Param('id') companyId: string,
    @Body() dto: CreateDiscountContractDto,
  ) {
    return this.companiesService.createContract(companyId, dto);
  }

  @Patch('contracts/:contractId')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ACCOUNTANT')
  updateContract(
    @Param('contractId') contractId: string,
    @Body() dto: UpdateDiscountContractDto,
  ) {
    return this.companiesService.updateContract(contractId, dto);
  }

  @Delete('contracts/:contractId')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  removeContract(@Param('contractId') contractId: string) {
    return this.companiesService.removeContract(contractId);
  }
}

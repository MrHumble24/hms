import { Module } from '@nestjs/common';
import { HotelServicesService } from './hotel-services.service.js';
import { HotelServicesController } from './hotel-services.controller.js';

@Module({
  controllers: [HotelServicesController],
  providers: [HotelServicesService],
  exports: [HotelServicesService],
})
export class HotelServicesModule {}

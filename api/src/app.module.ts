import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { RoomsModule } from './rooms/rooms.module.js';
import { GuestsModule } from './guests/guests.module.js';
import { BookingsModule } from './bookings/bookings.module.js';
import { HousekeepingModule } from './housekeeping/housekeeping.module.js';
import { MaintenanceModule } from './maintenance/maintenance.module.js';
import { AdminModule } from './admin/admin.module.js';
import { FinanceModule } from './finance/finance.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { CompaniesModule } from './companies/companies.module.js';
import { StaffModule } from './staff/staff.module.js';
import { EmehmonModule } from './emehmon/emehmon.module.js';
import { RestaurantModule } from './restaurant/restaurant.module.js';
import { TenantMiddleware } from './common/tenant-middleware.js';
import { BranchModule } from './branch/branch.module.js';
import { CommunicationsModule } from './communications/communications.module.js';
import { AuditModule } from './audit/audit.module.js';
import { BackupModule } from './backup/backup.module.js';
import { AiModule } from './ai/ai.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AdminModule,
    StaffModule,
    RoomsModule,
    GuestsModule,
    BookingsModule,
    CompaniesModule,
    HousekeepingModule,
    InventoryModule,
    RestaurantModule,
    FinanceModule,
    MaintenanceModule,
    EmehmonModule,
    BranchModule,
    CommunicationsModule,
    CommunicationsModule,
    AuditModule,
    BackupModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude('auth/login', 'auth/register', 'admin/(.*)')
      .forRoutes('*');
  }
}

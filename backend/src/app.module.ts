import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ServicesModule } from './services/services.module';
import { ScheduleModule } from './schedule/schedule.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { RevenueModule } from './revenue/revenue.module';
import { CalendarModule } from './calendar/calendar.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Core modules
    PrismaModule,

    // Feature modules
    AuthModule,
    ServicesModule,
    ScheduleModule,
    AppointmentsModule,
    RevenueModule,
    CalendarModule,
    EmailModule,
  ],
})
export class AppModule {}

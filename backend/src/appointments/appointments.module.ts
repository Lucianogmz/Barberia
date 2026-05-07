import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { CalendarModule } from '../calendar/calendar.module';
import { EmailModule } from '../email/email.module';
import { ScheduleModule } from '../schedule/schedule.module';

@Module({
  imports: [CalendarModule, EmailModule, ScheduleModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}

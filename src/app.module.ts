import { Module } from '@nestjs/common';
import { GoogleService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { GoogleController } from './app.controller';
import { IcsMeetingService } from './generate.ics.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [GoogleController],
  providers: [GoogleService, IcsMeetingService],
})
export class AppModule {}

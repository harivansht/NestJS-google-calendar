import { Module } from '@nestjs/common';
import { GoogleService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { GoogleController } from './app.controller';
import { IvrModule } from './ivr/ivr.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    IvrModule,
  ],
  controllers: [GoogleController],
  providers: [GoogleService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { GoogleService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { GoogleController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [GoogleController],
  providers: [GoogleService],
})
export class AppModule {}

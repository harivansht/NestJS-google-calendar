import { Module } from '@nestjs/common';
import { IvrService } from './ivr.service';
import { IvrController } from './ivr.controller';

@Module({
  controllers: [IvrController],
  providers: [IvrService],
})
export class IvrModule {}

import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { IvrService } from './ivr.service';

@Controller('ivr')
export class IvrController {
  constructor(private readonly ivrService: IvrService) {}

  // Outbound call endpoint
  @Post('call')
  async makeOutboundCall(
    @Body()
    body: {
      agentId: string;
      leadNumber: string;
      meta?: any;
      providerType?: string;
    },
  ) {
    await this.ivrService.makeOutboundCall(
      body.agentId,
      body.leadNumber,
      body.meta,
      body.providerType || 'knowlarity',
    );
    return { success: true };
  }

  // Inbound call webhook endpoint (for Knowlarity or other IVR webhooks)
  @Post('inbound')
  async handleInboundCall(
    @Body() payload: any,
    @Query('providerType') providerType?: string,
  ) {
    await this.ivrService.handleInboundCall(
      payload,
      providerType || 'knowlarity',
    );
    return { success: true };
  }

  // Fetch call logs for an agent (or all agents)
  @Get('logs')
  async getCallLogs(
    @Query('agentId') agentId?: string,
    @Query('providerType') providerType?: string,
  ) {
    return this.ivrService.fetchCallLogs(agentId, providerType || 'knowlarity');
  }

  // Fetch all agents for a given provider
  @Get('agents')
  async getAllAgents(): Promise<any[]> {
    return this.ivrService.fetchAllAgents();
  }
}

import { Injectable } from '@nestjs/common';
import { IvrProvider } from './ivr-provider.interface';
import { KnowlarityIvrProvider } from './providers/knowlarity.provider';

@Injectable()
export class IvrService {
  private providers: Map<string, IvrProvider> = new Map();

  constructor() {
    // Register default providers here. Can be extended to load dynamically.
    this.registerProvider('knowlarity', new KnowlarityIvrProvider());
  }

  registerProvider(type: string, provider: IvrProvider) {
    this.providers.set(type, provider);
  }

  getProvider(type: string = 'knowlarity'): IvrProvider {
    const provider = this.providers.get(type);
    if (!provider) throw new Error(`IVR provider '${type}' not found`);
    return provider;
  }

  async makeOutboundCall(
    agentId: string,
    leadNumber: string,
    meta?: any,
    providerType: string = 'knowlarity',
  ) {
    await this.getProvider(providerType).makeOutboundCall(
      agentId,
      leadNumber,
      meta,
    );
    // TODO: Log this interaction to DB
  }

  async handleInboundCall(payload: any, providerType: string = 'knowlarity') {
    await this.getProvider(providerType).handleInboundCall(payload);
    // TODO: Log interaction and store conversation data in DB
  }

  async fetchCallLogs(agentId?: string, providerType: string = 'knowlarity') {
    return this.getProvider(providerType).fetchCallLogs(agentId);
  }

  async fetchAllCallLogs(agentId?: string): Promise<any[]> {
    const allLogs: any[] = [];
    for (const provider of this.providers.values()) {
      const logs: any[] = await provider.fetchCallLogs(agentId);
      if (Array.isArray(logs)) {
        allLogs.push(...logs);
      }
    }
    return allLogs;
  }

  async fetchAllAgents(): Promise<any[]> {
    const allAgents: any[] = [];
    for (const provider of this.providers.values()) {
      if (typeof provider.fetchAllAgents === 'function') {
        const agents: any[] = await provider.fetchAllAgents();
        if (Array.isArray(agents)) {
          allAgents.push(...agents);
        }
      }
    }
    return allAgents;
  }
}

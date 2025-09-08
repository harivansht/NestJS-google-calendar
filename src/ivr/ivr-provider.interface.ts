export interface IvrProvider {
  makeOutboundCall(
    agentId: string,
    leadNumber: string,
    meta?: any,
  ): Promise<void>;
  handleInboundCall(payload: any): Promise<void>;
  fetchCallLogs(agentId?: string): Promise<any[]>;
  fetchAllCallLogs?(agentId?: string): Promise<any[]>;
  fetchAllAgents?(): Promise<any[]>;
}

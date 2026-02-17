import { FetchClient } from '../core/fetch-client';

export class TelemetryClient {
  private client: FetchClient;

  constructor(client: FetchClient) {
    this.client = client;
  }

  async logEvent(action: string, metadata?: Record<string, unknown>) {
    try {
      return await this.client.post('/telemetry', { action, metadata });
    } catch (error) {
      console.warn('[TelemetryClient] Logic fail-safe triggered. Event suppressed:', action, error);
      return null;
    }
  }
}

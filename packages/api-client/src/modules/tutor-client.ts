import { FetchClient } from '../core/fetch-client';

export class TutorClient {
  constructor(private client: FetchClient) {}

  async requestHelp(topicId: string, priority?: 'low' | 'medium' | 'high'): Promise<{ success: boolean; message: string }> {
    return this.client.post('/tutor/help/request', { topicId, priority });
  }

  async requestMasterNotes(topicId: string): Promise<{ success: boolean; message: string }> {
    return this.client.post('/tutor/notes/request', { topicId });
  }
}

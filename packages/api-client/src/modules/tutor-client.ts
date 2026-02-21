import { FetchClient } from '../core/fetch-client';

export class TutorClient {
  constructor(private client: FetchClient) {}

  async requestMasterNotes(topicId: string): Promise<{ success: boolean; message: string }> {
    return this.client.post('/tutor/notes/request', { topicId });
  }
}

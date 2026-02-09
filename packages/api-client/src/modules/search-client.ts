import { FetchClient } from '../core/fetch-client';

export type SearchKind = 'topic' | 'question';

export interface SearchResult {
  id: string;
  kind: SearchKind;
  label: string;
  path: string;
  meta?: string;
}

export class SearchClient {
  constructor(private client: FetchClient) {}

  async searchGlobal(query: string, type: SearchKind | 'all' = 'all'): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];
    
    // Explicitly cast type to string for URLSearchParams
    const params = new URLSearchParams({ q: query, type: type as string });
    const response = await this.client.get<{ results: SearchResult[] }>(`/search?${params.toString()}`);
    
    return response.results || [];
  }
}

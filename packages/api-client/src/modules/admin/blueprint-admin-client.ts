import { FetchClient } from '@quiz/api-client/core/fetch-client';
import {
  AdminBlueprint,
  AdminSuccessResponse,
  PaginatedResponse,
} from '@quiz/api-client/types';

type BlueprintPayload = Record<string, unknown>;

export class BlueprintAdminClient {
  constructor(private client: FetchClient) {}

  async getBlueprints(
    page: number = 1,
    limit: number = 20,
    search?: string
  ) {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search != null && search !== '') query.append('search', search);

    return this.client.get<PaginatedResponse<AdminBlueprint>>(
      `/admin/blueprints?${query.toString()}`
    );
  }

  async getBlueprintById(id: string) {
    return this.client.get<AdminBlueprint>(`/admin/blueprints/${id}`);
  }

  async createBlueprint(data: BlueprintPayload) {
    return this.client.post<AdminBlueprint, BlueprintPayload>(
      '/admin/blueprints',
      data
    );
  }

  async updateBlueprint(id: string, data: Partial<BlueprintPayload>) {
    return this.client.patch<AdminBlueprint, Partial<BlueprintPayload>>(
      `/admin/blueprints/${id}`,
      data
    );
  }

  async deleteBlueprint(id: string) {
    return this.client.delete<AdminSuccessResponse>(
      `/admin/blueprints/${id}`
    );
  }
}

import { FetchClient } from '@quiz/api-client/core/fetch-client';
import {
  AdminBlueprint,
  AdminSuccessResponse,
  PaginatedResponse,
  IAdminBlueprintConfigClient,
} from '@quiz/api-client/types';

type BlueprintPayload = Record<string, unknown>;

export class BlueprintAdminClient implements IAdminBlueprintConfigClient {
  constructor(private client: FetchClient) {}

  async getBlueprints(
    cursor?: string | null,
    limit: number = 20,
    search?: string
  ) {
    const query = new URLSearchParams({
      limit: limit.toString(),
    });
    if (cursor != null && cursor !== '') query.append('cursor', cursor);
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


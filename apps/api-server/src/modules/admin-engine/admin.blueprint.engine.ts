import { examBlueprints } from "@quiz/db";

import { container } from "@/modules/core/container";
import { DrizzleBlueprintRepository } from "@/repositories/implementations/drizzle-blueprint.repository";
import { IBlueprintRepository } from "@/repositories/interfaces/blueprint.repository.interface";

export class AdminBlueprintEngine {
  constructor(
    private readonly repository: IBlueprintRepository = container.get(DrizzleBlueprintRepository)
  ) {}

  async getBlueprints(cursor: string | null = null, limit: number = 20, filters?: { search?: string }) {
    const result = await this.repository.findAll(cursor, limit, filters);
    return {
        blueprints: result.data,
        total: result.total,
        nextCursor: result.nextCursor,
        limit: result.limit
    };
  }

  async createBlueprint(data: typeof examBlueprints.$inferInsert) {
    return await this.repository.create(data);
  }

  async updateBlueprint(id: string, data: Partial<typeof examBlueprints.$inferInsert>) {
    return await this.repository.update(id, data);
  }

  async deleteBlueprint(id: string) {
    return await this.repository.delete(id);
  }

  async getBlueprintById(id: string) {
    return await this.repository.findById(id);
  }
}

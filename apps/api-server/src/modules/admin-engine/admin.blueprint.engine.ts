import { examBlueprints } from "@quiz/db";

import { container } from "@/modules/core/container";
import { DrizzleBlueprintRepository } from "@/repositories/implementations/drizzle-blueprint.repository";
import { IBlueprintRepository } from "@/repositories/interfaces/blueprint.repository.interface";

export class AdminBlueprintEngine {
  constructor(
    private readonly repository: IBlueprintRepository = container.get(DrizzleBlueprintRepository)
  ) {}

  async getBlueprints(page: number = 1, limit: number = 20, filters?: { search?: string }) {
    return await this.repository.findAll(page, limit, filters);
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

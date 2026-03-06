import { domains } from '@quiz/db';

import { AuditService } from "@/modules/auth/audit.service";
import { container } from "@/modules/core/container";
import { DrizzleDomainRepository } from "@/repositories/implementations/drizzle-domain.repository";
import { IDomainRepository } from "@/repositories/interfaces/domain.repository.interface";

export class AdminDomainEngine {
  constructor(
    private readonly repository: IDomainRepository = container.get(DrizzleDomainRepository),
    private readonly auditService = container.get(AuditService)
  ) {}

  async getDomains(page: number = 1, limit: number = 20, filters?: { search?: string }) {
    return await this.repository.findAll(page, limit, filters);
  }

  async createDomain(data: typeof domains.$inferInsert, adminId: string) {
    const newDomain = await this.repository.create(data);
    await this.auditService.log({ userId: adminId, action: 'admin_create_domain', metadata: { domainId: newDomain.id } });
    return newDomain;
  }

  async updateDomain(id: string, data: Partial<typeof domains.$inferInsert>, adminId: string) {
    const updated = await this.repository.update(id, data);
    await this.auditService.log({ userId: adminId, action: 'admin_update_domain', metadata: { domainId: id } });
    return updated;
  }

  async deleteDomain(id: string, adminId: string) {
    const deleted = await this.repository.delete(id);
    await this.auditService.log({ userId: adminId, action: 'admin_delete_domain', metadata: { domainId: id } });
    return deleted;
  }

  async deleteDomainsBatch(ids: string[], adminId: string) {
    const deleted = await this.repository.deleteBatch(ids);
    await this.auditService.log({ userId: adminId, action: 'admin_batch_delete_domains', metadata: { count: ids.length } });
    return deleted;
  }

  async approveDomain(domainId: string, adminId: string) {
    const updated = await this.repository.updateStatus(domainId, 'active');
    await this.auditService.log({ userId: adminId, action: 'admin_approve_domain', metadata: { domainId } });
    return updated;
  }
}

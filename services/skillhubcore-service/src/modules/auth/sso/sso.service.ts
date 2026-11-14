import { PERMISSIONS, RBACService } from '@quiz/auth';
import type { PeoplePlatform, IUserRepository } from '@quiz/types';

import { DrizzleUserRepository, PlatformAccessRevokedError } from '../../user/user.repository';

export interface SsoActor {
  shadowUserId: string;
  roles: Array<'student' | 'faculty' | 'admin' | 'super_admin'>;
  platforms: PeoplePlatform[];
}

export class SsoAccessError extends Error {
  constructor(readonly status: 403 | 503 = 403) {
    super(status === 403 ? 'Forbidden' : 'Access administration unavailable');
  }
}

export class SsoService {
  constructor(private readonly userRepo: IUserRepository = new DrizzleUserRepository()) {}

  withRepository(userRepo: IUserRepository): SsoService {
    return new SsoService(userRepo);
  }

  async getUserPlatforms(userId: string): Promise<PeoplePlatform[]> {
    return this.userRepo.listPlatforms(userId);
  }

  // Trusted registration uses this existing operation for a newly created person.
  async grantPlatformAccess(userId: string, platform: PeoplePlatform): Promise<PeoplePlatform[]> {
    await this.userRepo.grantPlatformAccess(userId, platform);
    return this.userRepo.listPlatforms(userId);
  }

  async revokePlatformAccess(userId: string, platform: PeoplePlatform): Promise<PeoplePlatform[]> {
    await this.userRepo.revokePlatformAccess(userId, platform);
    return this.userRepo.listPlatforms(userId);
  }

  async administerAccess(actor: SsoActor, userId: string, action: 'read' | 'grant' | 'revoke', platform?: PeoplePlatform): Promise<PeoplePlatform[]> {
    try {
      return await this.userRepo.transaction(async repo => {
        if (repo.lockUsers === undefined) throw new SsoAccessError(503);
        await repo.lockUsers([actor.shadowUserId, userId]);
        const administrator = await repo.findById(actor.shadowUserId);
        const target = await repo.findById(userId);
        if (administrator === undefined || target === undefined
          || administrator.isActive !== true || administrator.deletedAt !== null
          || target.deletedAt !== null
          || !actor.roles.includes(administrator.role)
          || !RBACService.hasPermission([administrator.role], PERMISSIONS.USER_MANAGE)
          || !actor.platforms.includes(administrator.platform)
          || target.platform !== administrator.platform
          || (platform !== undefined && platform !== administrator.platform)) {
          throw new SsoAccessError();
        }
        const administratorPlatforms = await repo.listPlatforms(administrator.id);
        if (!administratorPlatforms.includes(administrator.platform)) throw new SsoAccessError();
        if (action === 'grant') {
          if (target.isActive !== true) throw new SsoAccessError();
          await repo.grantPlatformAccess(target.id, administrator.platform);
        }
        if (action === 'revoke') await repo.revokePlatformAccess(target.id, administrator.platform);
        const platforms = await repo.listPlatforms(target.id);
        await repo.createAuditLog({
          actorId: administrator.id, action: `platform_access_${action}`,
          platform: administrator.platform, success: true,
          metadata: { targetPersonId: target.id },
        });
        // This administrative surface can expose only its verified account platform.
        return platforms.filter(value => value === administrator.platform);
      });
    } catch (error) {
      const denied = error instanceof SsoAccessError ? error
        : new SsoAccessError(error instanceof PlatformAccessRevokedError ? 403 : 503);
      await this.userRepo.createAuditLog({
        actorId: actor.shadowUserId, action: `platform_access_${action}`,
        success: false, metadata: { code: denied.status === 403 ? 'DENIED' : 'UNAVAILABLE' },
      }).catch(() => { throw new SsoAccessError(503); });
      throw denied;
    }
  }
}

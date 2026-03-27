import type { PeoplePlatform, IUserRepository } from '@quiz/types';

import { DrizzleUserRepository } from '../../user/user.repository';

export class SsoService {
  constructor(private readonly userRepo: IUserRepository = new DrizzleUserRepository()) {}

  withRepository(userRepo: IUserRepository): SsoService {
    return new SsoService(userRepo);
  }

  async getUserPlatforms(userId: string): Promise<PeoplePlatform[]> {
    return this.userRepo.listPlatforms(userId);
  }

  async grantPlatformAccess(userId: string, platform: PeoplePlatform): Promise<PeoplePlatform[]> {
    await this.userRepo.grantPlatformAccess(userId, platform);
    return this.userRepo.listPlatforms(userId);
  }

  async revokePlatformAccess(userId: string, platform: PeoplePlatform): Promise<PeoplePlatform[]> {
    await this.userRepo.revokePlatformAccess(userId, platform);
    return this.userRepo.listPlatforms(userId);
  }
}

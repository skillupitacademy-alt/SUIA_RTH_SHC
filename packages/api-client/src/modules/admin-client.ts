import { FetchClient } from '../core/fetch-client';
import { ContentAdminClient } from './admin/content-admin-client';
import { UserAdminClient } from './admin/user-admin-client';
import { AnalyticsAdminClient } from './admin/analytics-admin-client';
import { SystemAdminClient } from './admin/system-admin-client';

/**
 * AdminClient Facade
 * 
 * Provides a unified entry point for all administrative operations by delegating
 * to specialized clients (Question, User, Analytics, System).
 * 
 * This class restores backward compatibility for tests and legacy components
 * while maintaining the underlying specialized architecture.
 */
export class AdminClient {
  public readonly questions: ContentAdminClient;
  public readonly users: UserAdminClient;
  public readonly analytics: AnalyticsAdminClient;
  public readonly system: SystemAdminClient;

  // Aliases for interface consistency
  public readonly blueprints: ContentAdminClient;
  public readonly jobs: SystemAdminClient;
  public readonly sessions: SystemAdminClient;
  public readonly audit: SystemAdminClient;

  constructor(fetchClient: FetchClient) {
    this.questions = new ContentAdminClient(fetchClient);
    this.users = new UserAdminClient(fetchClient);
    this.analytics = new AnalyticsAdminClient(fetchClient);
    this.system = new SystemAdminClient(fetchClient);

    // Set up aliases
    this.blueprints = this.questions;
    this.jobs = this.system;
    this.sessions = this.system;
    this.audit = this.system;
  }

  // Delegated methods for global scope access
  getDomains(...args: Parameters<ContentAdminClient['getDomains']>) {
    return this.questions.getDomains(...args);
  }

  getUsers(...args: Parameters<UserAdminClient['getUsers']>) {
    return this.users.getUsers(...args);
  }

  getMetrics(...args: Parameters<AnalyticsAdminClient['getMetrics']>) {
    return this.analytics.getMetrics(...args);
  }

  getQueueStats() {
    return this.system.getQueueStats();
  }
}

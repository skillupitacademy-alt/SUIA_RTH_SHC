import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminClient } from '../modules/admin-client';
import { FetchClient } from '../core/fetch-client';
import { QuestionAdminClient } from '../modules/admin/question-admin-client';
import { UserAdminClient } from '../modules/admin/user-admin-client';
import { AnalyticsAdminClient } from '../modules/admin/analytics-admin-client';

// Mock FetchClient
vi.mock('../core/fetch-client', () => {
  const FetchClient = vi.fn().mockImplementation(function (this: any) {
    this.get = vi.fn();
    this.post = vi.fn();
    this.put = vi.fn();
    this.delete = vi.fn();
    this.request = vi.fn();
    this.setPortalIdentity = vi.fn();
  });
  return { FetchClient };
});

describe('AdminClient & Specialized Sub-Clients', () => {
  let fetchClient: any;
  let adminClient: AdminClient;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchClient = new FetchClient('http://localhost:3000');
    adminClient = new AdminClient(fetchClient);
  });

  describe('Core AdminClient', () => {
    it('should initialize sub-clients with the same fetch client', () => {
      expect(adminClient.questions).toBeInstanceOf(QuestionAdminClient);
      expect(adminClient.users).toBeInstanceOf(UserAdminClient);
      expect(adminClient.analytics).toBeInstanceOf(AnalyticsAdminClient);
    });
  });

  describe('QuestionAdminClient Delegation', () => {
    it('should call fetchClient.get for domains', async () => {
      fetchClient.get.mockResolvedValue({ items: [] });
      await adminClient.questions.getDomains();
      expect(fetchClient.get).toHaveBeenCalledWith(expect.stringContaining('/admin/domains'));
    });
  });

  describe('UserAdminClient Delegation', () => {
    it('should call fetchClient.get for users', async () => {
      fetchClient.get.mockResolvedValue({ items: [] });
      await adminClient.users.getUsers();
      expect(fetchClient.get).toHaveBeenCalledWith(expect.stringContaining('/admin/users'));
    });
  });

  describe('AnalyticsAdminClient Delegation', () => {
    it('should call fetchClient.get for metrics', async () => {
      fetchClient.get.mockResolvedValue({ totalUsers: 100 });
      await adminClient.analytics.getMetrics();
      expect(fetchClient.get).toHaveBeenCalledWith(expect.stringContaining('/admin/metrics'));
    });
  });
});

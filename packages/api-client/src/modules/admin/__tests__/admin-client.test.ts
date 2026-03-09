import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminClient } from '../../admin-client';
import { FetchClient } from '../../../core/fetch-client';
import { QuestionAdminClient } from '../question-admin-client';
import { UserAdminClient } from '../user-admin-client';

// Mock FetchClient
vi.mock('../../../core/fetch-client', () => {
  return {
    FetchClient: vi.fn().mockImplementation(() => {
      return {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        request: vi.fn(),
        setPortalIdentity: vi.fn(),
      };
    }),
  };
});

describe('AdminClient & Specialized Sub-Clients', () => {
  let fetchClient: any;
  let adminClient: AdminClient;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchClient = new FetchClient('http://localhost:3000');
    adminClient = new AdminClient(fetchClient);
  });

  describe('Instantiation & Delegation', () => {
    it('should initialize all specialized sub-clients', () => {
      expect(adminClient.questions).toBeDefined();
      expect(adminClient.users).toBeDefined();
      expect(adminClient.analytics).toBeDefined();
      expect(adminClient.blueprints).toBeDefined();
      expect(adminClient.jobs).toBeDefined();
      expect(adminClient.sessions).toBeDefined();
      expect(adminClient.audit).toBeDefined();
    });

    it('should correctly delegate getDomains to QuestionAdminClient', async () => {
      const spy = vi.spyOn(adminClient.questions, 'getDomains');
      await adminClient.getDomains('cursor123', 10, 'search-term');
      expect(spy).toHaveBeenCalledWith('cursor123', 10, 'search-term');
    });

    it('should correctly delegate getUsers to UserAdminClient', async () => {
      const spy = vi.spyOn(adminClient.users, 'getUsers');
      await adminClient.getUsers('user-cursor', 50, 'active', { role: 'admin' });
      expect(spy).toHaveBeenCalledWith('user-cursor', 50, 'active', { role: 'admin' });
    });
  });

  describe('QuestionAdminClient (ISP/LSP Validation)', () => {
    it('should call the correct endpoint for getDomains with cursor', async () => {
      fetchClient.get.mockResolvedValue({ items: [], nextCursor: null });
      await adminClient.questions.getDomains('cursor-abc', 10, 'math');
      expect(fetchClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/admin/domains?cursor=cursor-abc&limit=10&search=math')
      );
    });

    it('should handle batch deletion of domains', async () => {
      fetchClient.post.mockResolvedValue({ success: true });
      await adminClient.questions.batchDeleteDomains(['id1', 'id2']);
      expect(fetchClient.post).toHaveBeenCalledWith(
        '/admin/domains/batch-delete',
        { ids: ['id1', 'id2'] }
      );
    });
  });

  describe('UserAdminClient (Consistency Validation)', () => {
    it('should call the correct endpoint for getUsers', async () => {
      fetchClient.get.mockResolvedValue({ items: [], nextCursor: null });
      await adminClient.users.getUsers(null, 20, 'deleted');
      expect(fetchClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/admin/users?limit=20&status=deleted')
      );
    });

    it('should support updating user details', async () => {
      fetchClient.patch.mockResolvedValue({ id: 'u1', name: 'New Name' });
      await adminClient.users.updateUser('u1', { name: 'New Name' });
      expect(fetchClient.patch).toHaveBeenCalledWith(
        '/admin/users/u1',
        { name: 'New Name' }
      );
    });
  });

  describe('Interface Segregation', () => {
    it('should implement specialized interfaces implicitly', () => {
      // This is a type-level check primarily, but we ensure instance existence
      expect(adminClient.questions).toBeInstanceOf(QuestionAdminClient);
      expect(adminClient.users).toBeInstanceOf(UserAdminClient);
    });
  });
});

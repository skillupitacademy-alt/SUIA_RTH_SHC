import { describe, expect, it, vi, beforeEach } from 'vitest';

import { AdminDomainEngine } from '../admin.domain.engine';

const mockRepository = {
  findAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  deleteBatch: vi.fn(),
};

const mockAuditService = {
  log: vi.fn(),
};

describe('AdminDomainEngine', () => {
  let engine: AdminDomainEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new AdminDomainEngine(mockRepository as any, mockAuditService as any);
  });

  describe('getDomains', () => {
    it('should fetch domains with pagination', async () => {
      const expected = { data: [{ id: '1', name: 'Domain 1' }], total: 1, nextCursor: null, limit: 10 };
      mockRepository.findAll.mockResolvedValue(expected);

      const result = await engine.getDomains(null, 10);

      expect(mockRepository.findAll).toHaveBeenCalledWith(null, 10, undefined);
      expect(result).toEqual({ domains: expected.data, total: 1, nextCursor: null, limit: 10 });
    });

    it('should apply search filter if provided', async () => {
      mockRepository.findAll.mockResolvedValue({ data: [], total: 0, nextCursor: null, limit: 10 });

      await engine.getDomains(null, 10, { search: 'test' });

      expect(mockRepository.findAll).toHaveBeenCalledWith(null, 10, { search: 'test' });
    });
  });

  describe('createDomain', () => {
    it('should insert a new domain and log audit', async () => {
      const mockResult = { id: '1', name: 'New Domain' };
      mockRepository.create.mockResolvedValue(mockResult);

      const result = await engine.createDomain({ name: 'New Domain' }, 'user-1');

      expect(mockRepository.create).toHaveBeenCalledWith({ name: 'New Domain' });
      expect(result).toEqual(mockResult);
      expect(mockAuditService.log).toHaveBeenCalledWith(expect.objectContaining({
        action: 'admin_create_domain',
        userId: 'user-1',
      }));
    });
  });

  describe('updateDomain', () => {
    it('should update domain and log audit', async () => {
      const mockResult = { id: '1', name: 'Updated' };
      mockRepository.update.mockResolvedValue(mockResult);

      const result = await engine.updateDomain('1', { name: 'Updated' }, 'user-1');

      expect(mockRepository.update).toHaveBeenCalledWith('1', { name: 'Updated' });
      expect(result).toEqual(mockResult);
      expect(mockAuditService.log).toHaveBeenCalledWith(expect.objectContaining({
        action: 'admin_update_domain',
        userId: 'user-1',
      }));
    });
  });

  describe('deleteDomain', () => {
    it('should delete domain and log audit', async () => {
      const mockResult = { id: '1', name: 'Deleted' };
      mockRepository.delete.mockResolvedValue(mockResult);

      const result = await engine.deleteDomain('1', 'user-1');

      expect(mockRepository.delete).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockResult);
      expect(mockAuditService.log).toHaveBeenCalledWith(expect.objectContaining({
        action: 'admin_delete_domain',
        userId: 'user-1',
      }));
    });
  });

  describe('deleteDomainsBatch', () => {
    it('should delete multiple domains and log audit', async () => {
      const ids = ['1', '2'];
      const deleted = [{ id: '1' }, { id: '2' }];
      mockRepository.deleteBatch.mockResolvedValue(deleted);

      const result = await engine.deleteDomainsBatch(ids, 'user-1');

      expect(mockRepository.deleteBatch).toHaveBeenCalledWith(ids);
      expect(result).toEqual(deleted);
      expect(mockAuditService.log).toHaveBeenCalledWith(expect.objectContaining({
        action: 'admin_batch_delete_domains',
        userId: 'user-1',
      }));
    });
  });
});

import { describe, it, expect } from 'vitest';
import { selectFields } from '../field-selector';

describe('Lib: Field Selector (Task 105)', () => {
    const mockData = {
        id: '1',
        name: 'Test Topic',
        description: 'Testing field selection',
        passwordHash: 'secret-hash',
        secretKey: 'top-secret'
    };

    const allowlist = ['id', 'name', 'description'];

    it('should return all fields in allowlist if no fieldsParam provided', () => {
        const result = selectFields(mockData, null, allowlist) as Record<string, any>;
        expect(result.id).toBe('1');
        expect(result.name).toBe('Test Topic');
        expect(result.passwordHash).toBeUndefined();
    });

    it('should filter fields based on comma-separated fieldsParam', () => {
        const result = selectFields(mockData, 'id,name', allowlist) as Record<string, any>;
        expect(result.id).toBe('1');
        expect(result.name).toBe('Test Topic');
        expect(result.description).toBeUndefined();
    });

    it('should block sensitive fields even if requested', () => {
        // passwordHash is not in allowlist anyway, but testing the block list logic
        const result = selectFields(mockData, 'id,passwordHash', [...allowlist, 'passwordHash']) as Record<string, any>;
        expect(result.id).toBe('1');
        expect(result.passwordHash).toBeUndefined();
    });

    it('should ignore fields not in the allowlist', () => {
        const result = selectFields(mockData, 'id,secretKey', allowlist) as Record<string, any>;
        expect(result.id).toBe('1');
        expect(result.secretKey).toBeUndefined();
    });

    it('should handle arrays of objects', () => {
        const dataArray = [mockData, { ...mockData, id: '2' }];
        const result = selectFields(dataArray, 'id', allowlist) as any[];
        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('1');
        expect(result[1].id).toBe('2');
        expect(result[0].name).toBeUndefined();
    });
});

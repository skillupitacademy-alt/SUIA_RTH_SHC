import { describe, it, expect } from 'vitest';
import { ApiError, unauthorized, forbidden, notFound, badRequest, internalError } from '../api-error';

describe('ApiError', () => {
  it('creates correct error types', () => {
    const err = new ApiError(400, 'Bad', 'BAD_REQUEST', { foo: 'bar' });
    expect(err.status).toBe(400);
    expect(err.message).toBe('Bad');
    expect(err.code).toBe('BAD_REQUEST');
    expect(err.details).toEqual({ foo: 'bar' });
  });

  it('helper functions work', () => {
    expect(unauthorized().status).toBe(401);
    expect(forbidden().status).toBe(403);
    expect(notFound('User', '1').status).toBe(404);
    expect(badRequest('Bad').status).toBe(400);
    expect(internalError().status).toBe(500);
  });

  it('toResponse formatting', () => {
     const err = new ApiError(401, 'Unauth', 'UNAUTHORIZED');
     const resp = err.toResponse();
     expect(resp.status).toBe(401);
     expect(resp.code).toBe('UNAUTHORIZED');
     expect(resp.timestamp).toBeDefined();
  });
});

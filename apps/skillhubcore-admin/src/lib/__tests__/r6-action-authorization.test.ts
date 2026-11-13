import { afterEach, describe, expect, it } from 'vitest';
import { SignJWT } from 'jose';
import { NextRequest } from 'next/server';
import { TokenService } from '@quiz/auth';
import { ROLE_PERMISSIONS } from '@quiz/auth/rbac/role-permissions';
import { PERMISSIONS, type Permission } from '@quiz/auth/rbac/permissions';
import { requireAdminRequest } from '../admin-route-guard';
import { setAccountAuthority } from '../shc-account-authority';
const paths = [
    ['/api/admin/questions/11111111-1111-4111-8111-111111111111', 'DELETE', PERMISSIONS.COURSE_DELETE],
    ['/api/admin/blueprints/11111111-1111-4111-8111-111111111111', 'PATCH', PERMISSIONS.COURSE_EDIT],
    ['/api/admin/domains/batch-delete', 'POST', PERMISSIONS.COURSE_DELETE],
    ['/api/tutorial-composer/sections/11111111-1111-4111-8111-111111111111/publish', 'POST', PERMISSIONS.TUTORIAL_AUTHOR_PUBLISH],
    ['/api/tutorial-left-sidebar', 'POST', PERMISSIONS.TUTORIAL_AUTHOR_PUBLISH],
] as const;
afterEach(() => setAccountAuthority(null));
async function request(path: string, method: string, role: 'admin' | 'super_admin' | 'faculty' | 'student', origin = 'http://skillhubcore.localhost:3007') {
    const token = await new SignJWT({ userId: 'synthetic-admin', sub: 'synthetic-admin', originalUserId: 'synthetic-admin', shadowUserId: 'synthetic-admin', roles: [role], brand: 'skillhubcore', tokenType: 'admin', isAdmin: true })
        .setProtectedHeader({ alg: 'HS256' }).setIssuer('skillhubcore.in').setAudience('shc-admin').setIssuedAt().setExpirationTime('5m').sign(TokenService.ADMIN_SECRET);
    setAccountAuthority({ getCurrentAccount: async () => ({ id: 'synthetic-admin', email: 'fixture@example.invalid', role, platform: 'skillhubcore', isActive: true }) });
    return new NextRequest(`http://skillhubcore.localhost:3007${path}`, { method, headers: { cookie: `accessToken=${token}`, origin } });
}
describe('R6 existing SHC action permission boundary with real JWT signatures', () => {
    it.each(paths)('allows existing admin actions at %s', async (path, method) => {
        expect(await requireAdminRequest(await request(path, method, 'admin'))).toBeNull();
    });
    it.each(paths)('allows existing super-admin actions at %s', async (path, method) => {
        expect(await requireAdminRequest(await request(path, method, 'super_admin'))).toBeNull();
    });
    it.each(paths)('denies faculty action at %s', async (path, method) => {
        expect((await requireAdminRequest(await request(path, method, 'faculty')))?.status).toBe(403);
    });
    it.each(paths)('denies student action at %s', async (path, method) => {
        expect((await requireAdminRequest(await request(path, method, 'student')))?.status).toBe(403);
    });
    it.each(paths)('checks the action permission independently of the admin-level gate at %s', async (path, method, permission) => {
        const prior = ROLE_PERMISSIONS.admin;
        // Controlled policy injection proves the guard checks this particular permission.
        // This does not introduce a restricted-admin product role or token claim.
        ROLE_PERMISSIONS.admin = prior.filter((value): value is Permission => value !== '*' && value !== permission);
        try {
            expect((await requireAdminRequest(await request(path, method, 'admin')))?.status).toBe(403);
        }
        finally {
            ROLE_PERMISSIONS.admin = prior;
        }
    });
    it('denies a valid signed administrator mutation from an untrusted origin', async () => {
        expect((await requireAdminRequest(await request(paths[0][0], 'DELETE', 'admin', 'https://evil.example')))?.status).toBe(403);
    });
});

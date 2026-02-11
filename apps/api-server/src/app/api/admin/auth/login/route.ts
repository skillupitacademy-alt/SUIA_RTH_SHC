export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { AdminAuthService } from '@/modules/auth/admin-auth.service';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    const ip = req.headers.get('x-forwarded-for') || '';
    
    const result = await AdminAuthService.login(email, password, ip);

    // Set Cookies
    const cookieDomain = process.env.COOKIE_DOMAIN || '.realtutorialhub.com';
    const isProd = process.env.NODE_ENV === 'production';

    const response = NextResponse.json({
        user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.profile?.name,
            isAdmin: true
        }
        // accessToken removed from body
    });

    response.cookies.set('admin_accessToken', result.accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        domain: cookieDomain,
        maxAge: 15 * 60
    });

    response.cookies.set('admin_refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        domain: cookieDomain,
        maxAge: 24 * 60 * 60 // 24 hours
    });

    return response;

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    
    // Return 401 for all auth failures to prevent enumeration, unless it's a specific logic error
    const status = error.message.includes('Locked') ? 403 : 401;
    return NextResponse.json({ error: error.message }, { status });
  }
}

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

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    
    const result = await AdminAuthService.login(email, password, ip);

    // Set Refresh Token HTTP-Only Cookie
    const response = NextResponse.json({
        user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.profile?.name,
            isAdmin: true
        },
        accessToken: result.accessToken
    });

    response.cookies.set('adminRefreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/admin',
        maxAge: 7 * 24 * 60 * 60
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

import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { AuthService } from '@/modules/auth/auth.service';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    // Validate inputs
    if (!email || !email.includes('@')) {
        // We still return 200 to be perfectly neutral, but we don't proceed
        return NextResponse.json({ success: true });
    }

    const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
    await AuthService.forgotPassword(email, ip);

    // Per contract: Always return 200 OK (even if email does not exist)
    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Return success to be neutral even on internal errors if we want strict non-disclosure,
    // but typically server errors can be 500 if they don't leak account status.
    // Given the contract "Always return 200 OK", we stay strict.
    console.error("Forgot password route error:", error.message);
    return NextResponse.json({ success: true });
  }
}

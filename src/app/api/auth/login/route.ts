import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (normalizedEmail !== 'alfitranurr@gmail.com') {
      return NextResponse.json(
        { success: false, error: 'Access denied: Unauthorized email address.' },
        { status: 403 }
      );
    }

    const expectedPassword = process.env.LOGIN_PASSWORD || 'alfitra123';
    if (password !== expectedPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid password.' },
        { status: 401 }
      );
    }

    const jwtSecret = process.env.JWT_SECRET || 'hustle-apps-fallback-secret-2026';
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    const token = await signToken({ email: normalizedEmail, expiresAt }, jwtSecret);

    const response = NextResponse.json({ success: true, message: 'Logged in successfully.' });
    
    // Set session cookie using Next.js Response cookies API
    response.cookies.set({
      name: 'session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    return response;
  } catch (error) {
    console.error('API Login Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

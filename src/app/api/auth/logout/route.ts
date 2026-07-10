import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
  
  // Clear cookie by setting it to empty and expiring it immediately
  response.cookies.set({
    name: 'session',
    value: '',
    path: '/',
    expires: new Date(0),
    maxAge: 0
  });

  return response;
}

export async function GET(req: NextRequest) {
  // Support GET requests as well for easy link-based logouts
  const response = NextResponse.redirect(new URL('/login', req.url));
  
  response.cookies.set({
    name: 'session',
    value: '',
    path: '/',
    expires: new Date(0),
    maxAge: 0
  });

  return response;
}

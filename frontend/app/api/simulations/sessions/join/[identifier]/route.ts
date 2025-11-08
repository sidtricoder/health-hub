import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const { identifier } = await params;

    console.log('[API Route] Join request - identifier:', identifier);

    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('[API Route] Forwarding to backend:', `${BACKEND_URL}/api/simulations/sessions/join/${identifier}`);

    const response = await fetch(`${BACKEND_URL}/api/simulations/sessions/join/${identifier}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error joining simulation session:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to join simulation session' },
      { status: 500 }
    );
  }
}

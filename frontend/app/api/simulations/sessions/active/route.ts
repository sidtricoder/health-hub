import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const scenario = searchParams.get('scenario') || '';
    const status = searchParams.get('status') || 'idle,active';

    const queryParams = new URLSearchParams({
      page,
      limit,
      status,
      ...(scenario && { scenario }),
    });

    const response = await fetch(`${BACKEND_URL}/api/simulations/sessions/active?${queryParams}`);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch active sessions' },
      { status: 500 }
    );
  }
}

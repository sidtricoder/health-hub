import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/simulations/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error creating simulation session:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create simulation session' },
      { status: 500 }
    );
  }
}

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
    console.error('Error fetching simulation sessions:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch simulation sessions' },
      { status: 500 }
    );
  }
}

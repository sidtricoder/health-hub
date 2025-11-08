import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['authorization'] = authHeader;
    }
    
    // Forward the request to the backend
    const response = await fetch(`${BACKEND_URL}/api/simulations`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to save simulation' }, 
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in simulation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    let url = `${BACKEND_URL}/api/simulations`;
    
    if (userId) {
      url += `/user/${userId}?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
      if (status) url += `&status=${status}`;
    } else {
      // Get leaderboard or all simulations
      const endpoint = searchParams.get('type') === 'leaderboard' ? '/leaderboard' : '';
      url += endpoint;
      if (endpoint === '/leaderboard') {
        const leaderboardLimit = searchParams.get('limit') || '10';
        url += `?limit=${leaderboardLimit}`;
      }
    }

    // Prepare headers for GET request
    const headers: HeadersInit = {};
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['authorization'] = authHeader;
    }

    const response = await fetch(url, {
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to fetch simulations' }, 
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in simulation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
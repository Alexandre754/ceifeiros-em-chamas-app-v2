import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Stateless JWT implementation - logout is handled client-side
    // Server just confirms the logout request
    return NextResponse.json({ 
      message: 'Logout successful' 
    }, { status: 200 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { desc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Extract JWT token from Authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify token
    let decoded: any;
    try {
      const jwtSecret = process.env.JWT_SECRET || 'ipcecma-secret-key-2024';
      decoded = jwt.verify(token, jwtSecret);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    // Check if user has required role
    const allowedRoles = ['admin_geral', 'admin_sede', 'pastor'];
    if (!decoded.role || !allowedRoles.includes(decoded.role)) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions. Only administrators and pastors can access user credentials',
          code: 'FORBIDDEN' 
        },
        { status: 403 }
      );
    }

    // Query users with only required fields
    const userCredentials = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        originalPassword: users.originalPassword,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return NextResponse.json(userCredentials, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
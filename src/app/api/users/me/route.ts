import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, congregations, memberPermissions, members } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ipcecma-secret-key-2024';

interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export async function GET(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          code: 'INVALID_TOKEN' 
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return NextResponse.json(
          { 
            error: 'Unauthorized',
            code: 'TOKEN_EXPIRED' 
          },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          code: 'INVALID_TOKEN' 
        },
        { status: 401 }
      );
    }

    // Extract userId from decoded token
    const userId = decoded.userId;

    if (!userId) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          code: 'INVALID_TOKEN' 
        },
        { status: 401 }
      );
    }

    // Query user from database with congregation join
    const userResult = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        congregationId: users.congregationId,
        hasGeneralAccess: users.hasGeneralAccess,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        congregation: {
          id: congregations.id,
          name: congregations.name,
          city: congregations.city,
          state: congregations.state,
          address: congregations.address,
          isHeadquarters: congregations.isHeadquarters,
        }
      })
      .from(users)
      .leftJoin(congregations, eq(users.congregationId, congregations.id))
      .where(eq(users.id, userId))
      .limit(1);

    // Check if user exists
    if (userResult.length === 0) {
      return NextResponse.json(
        { 
          error: 'User not found',
          code: 'USER_NOT_FOUND' 
        },
        { status: 401 }
      );
    }

    const user = userResult[0];

    // Get user permissions
    const permissions = await db
      .select({
        key: memberPermissions.permissionKey,
        granted: memberPermissions.granted,
      })
      .from(memberPermissions)
      .where(
        or(
          eq(memberPermissions.userId, userId),
          user.email ? eq(memberPermissions.memberId, db.select({ id: members.id }).from(members).where(eq(members.email, user.email))) : undefined
        )
      );

    // Format response - exclude password, handle null congregation
    const response: any = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      congregationId: user.congregationId,
      hasGeneralAccess: user.hasGeneralAccess,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      permissions: permissions.filter(p => p.granted).map(p => p.key)
    };

    // Only include congregation if it exists
    if (user.congregation && user.congregation.id) {
      response.congregation = user.congregation;
    }

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('GET /api/users/me error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}

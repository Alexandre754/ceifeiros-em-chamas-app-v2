import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, congregations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ipcecma-secret-key-2024';

interface JWTPayload {
  userId: number;
  role: string;
  congregationId: number;
}

function authenticateRequest(request: NextRequest): JWTPayload | null {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

function isAuthorized(user: JWTPayload, userCongregation: any): boolean {
  if (user.role === 'admin_geral') {
    return true;
  }
  
  if (user.role === 'admin_sede' && userCongregation?.isHeadquarters) {
    return true;
  }
  
  return false;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const userId = params.id;
    const userIdInt = parseInt(userId);

    if (!userId || isNaN(userIdInt)) {
      return NextResponse.json(
        { error: 'Valid user ID is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userCongregationRecord = await db
      .select()
      .from(congregations)
      .where(eq(congregations.id, user.congregationId))
      .limit(1);

    if (!isAuthorized(user, userCongregationRecord[0])) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const targetUser = await db
      .select({
        id: users.id,
        hasGeneralAccess: users.hasGeneralAccess,
      })
      .from(users)
      .where(eq(users.id, userIdInt))
      .limit(1);

    if (targetUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      hasGeneralAccess: targetUser[0].hasGeneralAccess || false
    }, { status: 200 });
  } catch (error) {
    console.error('GET general access error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const userId = params.id;
    const userIdInt = parseInt(userId);

    if (!userId || isNaN(userIdInt)) {
      return NextResponse.json(
        { error: 'Valid user ID is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userCongregationRecord = await db
      .select()
      .from(congregations)
      .where(eq(congregations.id, user.congregationId))
      .limit(1);

    if (!isAuthorized(user, userCongregationRecord[0])) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { hasGeneralAccess } = body;

    if (typeof hasGeneralAccess !== 'boolean') {
      return NextResponse.json(
        { error: 'hasGeneralAccess must be a boolean', code: 'INVALID_VALUE' },
        { status: 400 }
      );
    }

    const targetUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userIdInt))
      .limit(1);

    if (targetUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const updated = await db
      .update(users)
      .set({
        hasGeneralAccess: hasGeneralAccess,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userIdInt))
      .returning();

    return NextResponse.json({
      message: 'General access updated successfully',
      hasGeneralAccess: updated[0].hasGeneralAccess
    }, { status: 200 });
  } catch (error) {
    console.error('PATCH general access error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userCongregationAccess, users, congregations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: number;
  role: string;
  congregationId: number;
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; congregationId: string }> }
) {
  try {
    const params = await context.params;
    // ... rest of the code updated to use awaited params ...
    // Extract and validate JWT token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'MISSING_TOKEN' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded: JWTPayload;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'ipcecma-secret-key-2024'
      ) as JWTPayload;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    // Check authorization - only admin_geral and admin_sede from headquarters
    if (decoded.role !== 'admin_geral' && decoded.role !== 'admin_sede') {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // If admin_sede, verify they are from headquarters
    if (decoded.role === 'admin_sede') {
      const adminUser = await db
        .select({ congregationId: users.congregationId })
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);

      if (adminUser.length === 0) {
        return NextResponse.json(
          { error: 'User not found', code: 'USER_NOT_FOUND' },
          { status: 404 }
        );
      }

      if (adminUser[0].congregationId) {
        const congregation = await db
          .select({ isHeadquarters: congregations.isHeadquarters })
          .from(congregations)
          .where(eq(congregations.id, adminUser[0].congregationId))
          .limit(1);

        if (congregation.length === 0 || !congregation[0].isHeadquarters) {
          return NextResponse.json(
            { error: 'Only headquarters administrators can remove congregation access', code: 'FORBIDDEN' },
            { status: 403 }
          );
        }
      }
    }

    // Validate user ID parameter
    const userId = params.id;
    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'Valid user ID is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    // Validate congregation ID parameter
    const congregationId = params.congregationId;
    if (!congregationId || isNaN(parseInt(congregationId))) {
      return NextResponse.json(
        { error: 'Valid congregation ID is required', code: 'INVALID_CONGREGATION_ID' },
        { status: 400 }
      );
    }

    const userIdInt = parseInt(userId);
    const congregationIdInt = parseInt(congregationId);

    // Find the access record
    const existingAccess = await db
      .select()
      .from(userCongregationAccess)
      .where(
        and(
          eq(userCongregationAccess.userId, userIdInt),
          eq(userCongregationAccess.congregationId, congregationIdInt)
        )
      )
      .limit(1);

    if (existingAccess.length === 0) {
      return NextResponse.json(
        { error: 'Congregation access record not found', code: 'ACCESS_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete the access record
    const deleted = await db
      .delete(userCongregationAccess)
      .where(
        and(
          eq(userCongregationAccess.userId, userIdInt),
          eq(userCongregationAccess.congregationId, congregationIdInt)
        )
      )
      .returning();

    return NextResponse.json(
      {
        message: 'Congregation access removed successfully',
        deletedAccess: deleted[0]
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE congregation access error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
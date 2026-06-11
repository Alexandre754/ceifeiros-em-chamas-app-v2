import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, congregations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ipcecma-secret-key-2024';

interface JWTPayload {
  userId: number;
  role: string;
  congregationId?: number;
}

function verifyToken(request: NextRequest): JWTPayload | null {
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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tokenPayload = verifyToken(request);
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const userId = params.id;
    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'Valid user ID is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    const userIdNum = parseInt(userId);

    // Fetch current user for authorization
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, tokenPayload.userId))
      .limit(1);

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Current user not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Authorization: Only admins can view other users
    const isAdmin = currentUser.role === 'admin_geral' || currentUser.role === 'admin_sede';
    const isViewingSelf = currentUser.id === userIdNum;

    if (!isViewingSelf && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Fetch target user with congregation
    const [targetUser] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        congregationId: users.congregationId,
        approved: users.approved,
        hasGeneralAccess: users.hasGeneralAccess,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        congregation: {
          id: congregations.id,
          name: congregations.name,
          city: congregations.city,
          state: congregations.state,
          isHeadquarters: congregations.isHeadquarters,
        },
      })
      .from(users)
      .leftJoin(congregations, eq(users.congregationId, congregations.id))
      .where(eq(users.id, userIdNum))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Don't return password fields
    return NextResponse.json(targetUser, { status: 200 });

  } catch (error) {
    console.error('GET user error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tokenPayload = verifyToken(request);
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const userId = params.id;
    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'Valid user ID is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    const userIdNum = parseInt(userId);

    // Fetch current user for authorization
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, tokenPayload.userId))
      .limit(1);

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Current user not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if target user exists
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userIdNum))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Authorization: Only admins can edit other users
    const isAdmin = currentUser.role === 'admin_geral' || currentUser.role === 'admin_sede';
    const isEditingSelf = currentUser.id === userIdNum;

    if (!isEditingSelf && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    // Basic fields
    if (body.name !== undefined && body.name.trim()) {
      updateData.name = body.name.trim();
    }

    if (body.phone !== undefined) {
      updateData.phone = body.phone ? body.phone.trim() : null;
    }

    // Role - only admins can change roles
    if (body.role !== undefined) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Only admins can change user roles', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
      const validRoles = ['admin_geral', 'admin_sede', 'admin_congregacao', 'lider', 'membro'];
      if (!validRoles.includes(body.role)) {
        return NextResponse.json(
          { error: 'Invalid role', code: 'INVALID_ROLE' },
          { status: 400 }
        );
      }
      updateData.role = body.role;
    }

    // Congregation - only admins can change congregation
    if (body.congregationId !== undefined) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Only admins can change user congregation', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      if (body.congregationId) {
        const [congregation] = await db
          .select()
          .from(congregations)
          .where(eq(congregations.id, body.congregationId))
          .limit(1);

        if (!congregation) {
          return NextResponse.json(
            { error: 'Congregation not found', code: 'CONGREGATION_NOT_FOUND' },
            { status: 404 }
          );
        }
      }

      updateData.congregationId = body.congregationId || null;
    }

    // Approved status - only admins can change
    if (body.approved !== undefined) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Only admins can change approval status', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
      updateData.approved = body.approved;
    }

    // Has General Access - only admins can change
    if (body.hasGeneralAccess !== undefined) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Only admins can change general access', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
      updateData.hasGeneralAccess = body.hasGeneralAccess;
    }

    // Perform update
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userIdNum))
      .returning();

    // Fetch complete updated user with congregation
    const [completeUser] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        congregationId: users.congregationId,
        approved: users.approved,
        hasGeneralAccess: users.hasGeneralAccess,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        congregation: {
          id: congregations.id,
          name: congregations.name,
          city: congregations.city,
          state: congregations.state,
          isHeadquarters: congregations.isHeadquarters,
        },
      })
      .from(users)
      .leftJoin(congregations, eq(users.congregationId, congregations.id))
      .where(eq(users.id, userIdNum))
      .limit(1);

    return NextResponse.json(completeUser, { status: 200 });

  } catch (error) {
    console.error('PUT user error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tokenPayload = verifyToken(request);
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const userId = params.id;
    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'Valid user ID is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    const userIdNum = parseInt(userId);

    // Fetch current user for authorization
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, tokenPayload.userId))
      .limit(1);

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Current user not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Only admin_geral can delete users
    if (currentUser.role !== 'admin_geral') {
      return NextResponse.json(
        { error: 'Only admin_geral can delete users', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Check if target user exists
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userIdNum))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Don't allow deleting yourself
    if (currentUser.id === userIdNum) {
      return NextResponse.json(
        { error: 'Cannot delete your own account', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Delete user
    await db
      .delete(users)
      .where(eq(users.id, userIdNum));

    return NextResponse.json(
      {
        message: 'User deleted successfully',
        id: userIdNum
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('DELETE user error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

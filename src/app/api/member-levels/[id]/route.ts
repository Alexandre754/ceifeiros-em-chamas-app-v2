import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { memberLevels } from '@/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ipcecma-secret-key-2024';

interface JWTPayload {
  userId: number;
  role: string;
  congregationId: number;
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

function isAdmin(role: string): boolean {
  return role === 'admin_geral' || role === 'admin_sede';
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const memberLevel = await db
      .select()
      .from(memberLevels)
      .where(eq(memberLevels.id, parseInt(id)))
      .limit(1);

    if (memberLevel.length === 0) {
      return NextResponse.json(
        { error: 'Member level not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(memberLevel[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    if (!isAdmin(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, level, active } = body;

    // Validate name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json(
          { error: 'Name must be a non-empty string', code: 'INVALID_NAME' },
          { status: 400 }
        );
      }
    }

    // Validate level if provided
    if (level !== undefined) {
      if (typeof level !== 'number' || level < 1 || level > 10) {
        return NextResponse.json(
          { error: 'Level must be between 1 and 10', code: 'INVALID_LEVEL' },
          { status: 400 }
        );
      }
    }

    // Check if member level exists
    const existing = await db
      .select()
      .from(memberLevels)
      .where(eq(memberLevels.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Member level not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description ? description.trim() : description;
    }

    if (level !== undefined) {
      updateData.level = level;
    }

    if (active !== undefined) {
      updateData.active = active;
    }

    const updated = await db
      .update(memberLevels)
      .set(updateData)
      .where(eq(memberLevels.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    if (!isAdmin(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if member level exists
    const existing = await db
      .select()
      .from(memberLevels)
      .where(eq(memberLevels.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Member level not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Soft delete by setting active to false
    const deleted = await db
      .update(memberLevels)
      .set({
        active: false,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(memberLevels.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Member level deleted successfully',
        id: parseInt(id),
        deletedRecord: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
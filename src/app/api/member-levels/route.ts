import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { memberLevels } from '@/db/schema';
import { eq, like, or, asc, and } from 'drizzle-orm';
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

function isAuthorized(role: string): boolean {
  return role === 'admin_geral' || role === 'admin_sede';
}

export async function GET(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const activeParam = searchParams.get('active');

    let query = db.select().from(memberLevels);

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(memberLevels.name, `%${search}%`),
          like(memberLevels.description, `%${search}%`)
        )
      );
    }

    if (activeParam !== null) {
      const isActive = activeParam === 'true';
      conditions.push(eq(memberLevels.active, isActive));
    }

    if (conditions.length > 0) {
      query = (query as any).where(
        conditions.length === 1 ? conditions[0] : and(...conditions)
      );
    }

    const results = await query.orderBy(asc(memberLevels.level));

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    if (!isAuthorized(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, level, active } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string', code: 'INVALID_NAME' },
        { status: 400 }
      );
    }

    if (level === undefined || level === null) {
      return NextResponse.json(
        { error: 'Level is required', code: 'MISSING_LEVEL' },
        { status: 400 }
      );
    }

    if (typeof level !== 'number' || !Number.isInteger(level)) {
      return NextResponse.json(
        { error: 'Level must be an integer', code: 'INVALID_LEVEL_TYPE' },
        { status: 400 }
      );
    }

    if (level < 1 || level > 10) {
      return NextResponse.json(
        { error: 'Level must be between 1 and 10 inclusive', code: 'INVALID_LEVEL_RANGE' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const trimmedDescription = description ? description.trim() : null;
    const isActive = active !== undefined ? active : true;

    const now = new Date().toISOString();

    const newMemberLevel = await db
      .insert(memberLevels)
      .values({
        name: trimmedName,
        description: trimmedDescription,
        level: level,
        active: isActive,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newMemberLevel[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
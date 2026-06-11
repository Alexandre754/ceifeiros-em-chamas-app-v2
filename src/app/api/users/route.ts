import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, congregations } from '@/db/schema';
import { eq, like, or } from 'drizzle-orm';
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

export async function GET(request: NextRequest) {
  try {
    const tokenPayload = verifyToken(request);
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

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

    const isAdmin = currentUser.role === 'admin_geral' || currentUser.role === 'admin_sede';
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can list users', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let query = db
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
      .leftJoin(congregations, eq(users.congregationId, congregations.id));

    if (search) {
      query = (query as any).where(
        or(
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`)
        )
      );
    }

    const allUsers = await query;

    return NextResponse.json(allUsers, { status: 200 });

  } catch (error) {
    console.error('GET users error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

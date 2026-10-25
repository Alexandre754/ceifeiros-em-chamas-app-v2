import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userCongregationAccess, users, congregations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
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

    const accessRecords = await db
      .select({
        id: userCongregationAccess.id,
        userId: userCongregationAccess.userId,
        congregationId: userCongregationAccess.congregationId,
        accessLevel: userCongregationAccess.accessLevel,
        grantedAt: userCongregationAccess.grantedAt,
        grantedBy: userCongregationAccess.grantedBy,
        congregation: {
          id: congregations.id,
          name: congregations.name,
          city: congregations.city,
          state: congregations.state,
          isHeadquarters: congregations.isHeadquarters,
        },
      })
      .from(userCongregationAccess)
      .leftJoin(congregations, eq(userCongregationAccess.congregationId, congregations.id))
      .where(eq(userCongregationAccess.userId, userIdInt));

    const enrichedRecords = await Promise.all(
      accessRecords.map(async (record) => {
        let grantedByUser = null;
        if (record.grantedBy) {
          const grantedByResult = await db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
            })
            .from(users)
            .where(eq(users.id, record.grantedBy))
            .limit(1);
          
          if (grantedByResult.length > 0) {
            grantedByUser = grantedByResult[0];
          }
        }

        return {
          ...record,
          grantedByUser,
        };
      })
    );

    return NextResponse.json(enrichedRecords, { status: 200 });
  } catch (error) {
    console.error('GET user congregation access error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const { congregationId, accessLevel } = body;

    if (!congregationId || isNaN(parseInt(congregationId))) {
      return NextResponse.json(
        { error: 'Valid congregation ID is required', code: 'INVALID_CONGREGATION_ID' },
        { status: 400 }
      );
    }

    const congregationIdInt = parseInt(congregationId);

    if (!accessLevel) {
      return NextResponse.json(
        { error: 'Access level is required', code: 'MISSING_ACCESS_LEVEL' },
        { status: 400 }
      );
    }

    const validAccessLevels = ['read', 'write', 'admin'];
    if (!validAccessLevels.includes(accessLevel)) {
      return NextResponse.json(
        { 
          error: 'Access level must be one of: read, write, admin', 
          code: 'INVALID_ACCESS_LEVEL' 
        },
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

    const targetCongregation = await db
      .select()
      .from(congregations)
      .where(eq(congregations.id, congregationIdInt))
      .limit(1);

    if (targetCongregation.length === 0) {
      return NextResponse.json(
        { error: 'Congregation not found', code: 'CONGREGATION_NOT_FOUND' },
        { status: 404 }
      );
    }

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

    if (existingAccess.length > 0) {
      return NextResponse.json(
        { 
          error: 'User already has access to this congregation', 
          code: 'DUPLICATE_ACCESS' 
        },
        { status: 400 }
      );
    }

    const newAccess = await db
      .insert(userCongregationAccess)
      .values({
        userId: userIdInt,
        congregationId: congregationIdInt,
        accessLevel: accessLevel,
        grantedAt: new Date().toISOString(),
        grantedBy: user.userId,
      })
      .returning();

    const congregationDetails = await db
      .select({
        id: congregations.id,
        name: congregations.name,
        city: congregations.city,
        state: congregations.state,
        isHeadquarters: congregations.isHeadquarters,
      })
      .from(congregations)
      .where(eq(congregations.id, parseInt(congregationId)))
      .limit(1);

    const grantedByDetails = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, user.userId))
      .limit(1);

    const response = {
      ...newAccess[0],
      congregation: congregationDetails[0] || null,
      grantedByUser: grantedByDetails[0] || null,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('POST user congregation access error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
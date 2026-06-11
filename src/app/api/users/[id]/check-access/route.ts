import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, userCongregationAccess, congregations } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ipcecma-secret-key-2024';

interface JWTPayload {
  userId: number;
  role: string;
  congregationId?: number;
}

interface CongregationAccess {
  id: number;
  name: string;
  city: string;
  state: string;
  accessType: 'general' | 'role' | 'granted' | 'assigned';
}

interface CheckAccessResponse {
  userId: number;
  hasGeneralAccess: boolean;
  accessibleCongregations: CongregationAccess[];
  canAccessAll: boolean;
}

interface SpecificAccessResponse {
  userId: number;
  congregationId: number;
  hasAccess: boolean;
  accessType: 'general' | 'role' | 'granted' | 'assigned' | 'none';
  congregation: {
    id: number;
    name: string;
    city: string;
    state: string;
  } | null;
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
    // Authenticate current user
    const tokenPayload = verifyToken(request);
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTHENTICATION_REQUIRED' },
        { status: 401 }
      );
    }

    // Validate target user ID
    const params = await context.params;
    const targetUserId = params.id;
    if (!targetUserId || isNaN(parseInt(targetUserId))) {
      return NextResponse.json(
        { error: 'Valid user ID is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    const targetUserIdNum = parseInt(targetUserId);

    // Fetch current user details
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, tokenPayload.userId))
      .limit(1);

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Current user not found', code: 'USER_NOT_FOUND' },
        { status: 401 }
      );
    }

    // Authorization check: Only allow users to check their own access OR admins can check any user
    const isCheckingSelf = currentUser.id === targetUserIdNum;
    const isAdmin = currentUser.role === 'admin_geral' || currentUser.role === 'admin_sede';
    
    if (!isCheckingSelf && !isAdmin) {
      return NextResponse.json(
        { 
          error: 'You do not have permission to check this user\'s access',
          code: 'INSUFFICIENT_PERMISSIONS'
        },
        { status: 403 }
      );
    }

    // Fetch target user
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserIdNum))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const congregationIdParam = searchParams.get('congregationId');

    // If checking specific congregation
    if (congregationIdParam) {
      const congregationId = parseInt(congregationIdParam);
      if (isNaN(congregationId)) {
        return NextResponse.json(
          { error: 'Valid congregation ID is required', code: 'INVALID_CONGREGATION_ID' },
          { status: 400 }
        );
      }

      const [congregation] = await db
        .select()
        .from(congregations)
        .where(eq(congregations.id, congregationId))
        .limit(1);

      if (!congregation) {
        return NextResponse.json(
          { error: 'Congregation not found', code: 'CONGREGATION_NOT_FOUND' },
          { status: 404 }
        );
      }

      // Check access in priority order
      let hasAccess = false;
      let accessType: 'general' | 'role' | 'granted' | 'assigned' | 'none' = 'none';

      // 1. Check hasGeneralAccess flag
      if (targetUser.hasGeneralAccess) {
        hasAccess = true;
        accessType = 'general';
      }
      // 2. Check role-based access
      else if (targetUser.role === 'admin_geral') {
        hasAccess = true;
        accessType = 'role';
      }
      else if (targetUser.role === 'admin_sede') {
        // Check if user is from headquarters congregation
        if (targetUser.congregationId) {
          const [userCongregation] = await db
            .select()
            .from(congregations)
            .where(eq(congregations.id, targetUser.congregationId))
            .limit(1);

          if (userCongregation && userCongregation.isHeadquarters) {
            hasAccess = true;
            accessType = 'role';
          }
        }
      }
      else if (targetUser.role === 'admin_congregacao' || targetUser.role === 'membro') {
        // Check if congregation matches user's assigned congregation
        if (targetUser.congregationId === congregationId) {
          hasAccess = true;
          accessType = 'assigned';
        }
      }

      // 3. Check userCongregationAccess table if not already granted
      if (!hasAccess) {
        const [grantedAccess] = await db
          .select()
          .from(userCongregationAccess)
          .where(
            and(
              eq(userCongregationAccess.userId, targetUserIdNum),
              eq(userCongregationAccess.congregationId, congregationId)
            )
          )
          .limit(1);

        if (grantedAccess) {
          hasAccess = true;
          accessType = 'granted';
        }
      }

      const response: SpecificAccessResponse = {
        userId: targetUserIdNum,
        congregationId: congregationId,
        hasAccess,
        accessType,
        congregation: hasAccess ? {
          id: congregation.id,
          name: congregation.name,
          city: congregation.city,
          state: congregation.state
        } : null
      };

      return NextResponse.json(response, { status: 200 });
    }

    // Get all accessible congregations
    let accessibleCongregations: CongregationAccess[] = [];
    let canAccessAll = false;

    // 1. Check hasGeneralAccess flag
    if (targetUser.hasGeneralAccess) {
      canAccessAll = true;
      const allCongregations = await db.select().from(congregations);
      accessibleCongregations = allCongregations.map(cong => ({
        id: cong.id,
        name: cong.name,
        city: cong.city,
        state: cong.state,
        accessType: 'general' as const
      }));
    }
    // 2. Check role-based access
    else if (targetUser.role === 'admin_geral') {
      canAccessAll = true;
      const allCongregations = await db.select().from(congregations);
      accessibleCongregations = allCongregations.map(cong => ({
        id: cong.id,
        name: cong.name,
        city: cong.city,
        state: cong.state,
        accessType: 'role' as const
      }));
    }
    else if (targetUser.role === 'admin_sede' && targetUser.congregationId) {
      // Check if user is from headquarters
      const [userCongregation] = await db
        .select()
        .from(congregations)
        .where(eq(congregations.id, targetUser.congregationId))
        .limit(1);

      if (userCongregation && userCongregation.isHeadquarters) {
        canAccessAll = true;
        const allCongregations = await db.select().from(congregations);
        accessibleCongregations = allCongregations.map(cong => ({
          id: cong.id,
          name: cong.name,
          city: cong.city,
          state: cong.state,
          accessType: 'role' as const
        }));
      }
    }
    
    // If not admin with full access, check specific permissions
    if (!canAccessAll) {
      const congregationIds = new Set<number>();
      const congregationAccessTypes = new Map<number, 'granted' | 'assigned'>();

      // Add assigned congregation
      if (targetUser.congregationId && (targetUser.role === 'admin_congregacao' || targetUser.role === 'membro')) {
        congregationIds.add(targetUser.congregationId);
        congregationAccessTypes.set(targetUser.congregationId, 'assigned');
      }

      // Add granted access congregations
      const grantedAccess = await db
        .select()
        .from(userCongregationAccess)
        .where(eq(userCongregationAccess.userId, targetUserIdNum));

      for (const access of grantedAccess) {
        if (!congregationIds.has(access.congregationId)) {
          congregationIds.add(access.congregationId);
          congregationAccessTypes.set(access.congregationId, 'granted');
        }
      }

      // Fetch congregation details
      if (congregationIds.size > 0) {
        const congregationsList = await db
          .select()
          .from(congregations)
          .where(inArray(congregations.id, Array.from(congregationIds)));

        accessibleCongregations = congregationsList.map(cong => ({
          id: cong.id,
          name: cong.name,
          city: cong.city,
          state: cong.state,
          accessType: congregationAccessTypes.get(cong.id) || 'granted'
        }));
      }
    }

    const response: CheckAccessResponse = {
      userId: targetUserIdNum,
      hasGeneralAccess: targetUser.hasGeneralAccess || false,
      accessibleCongregations,
      canAccessAll
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('GET check-access error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}
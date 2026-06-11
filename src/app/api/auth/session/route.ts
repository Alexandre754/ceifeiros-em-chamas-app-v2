import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, congregations, memberPermissions, members } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Unauthorized - No token provided',
        code: 'NO_TOKEN' 
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify JWT token
    let decoded: any;
    try {
      const secret = process.env.JWT_SECRET || 'ipcecma-secret-key-2024';
      decoded = jwt.verify(token, secret);
    } catch (error) {
      return NextResponse.json({ 
        error: 'Unauthorized - Invalid token',
        code: 'INVALID_TOKEN' 
      }, { status: 401 });
    }

    // Extract userId from decoded token
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return NextResponse.json({ 
        error: 'Unauthorized - Invalid token payload',
        code: 'INVALID_TOKEN_PAYLOAD' 
      }, { status: 401 });
    }

    const userIdInt = parseInt(userId.toString());
    
    if (isNaN(userIdInt)) {
      return NextResponse.json({ 
        error: 'Unauthorized - Invalid user ID in token',
        code: 'INVALID_USER_ID' 
      }, { status: 401 });
    }

    // Query user with optional congregation data
    console.log('🔍 Buscando sessão do usuário ID:', userIdInt);
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
      .where(eq(users.id, userIdInt))
      .limit(1);

    if (userResult.length === 0) {
      console.log('❌ Usuário da sessão não encontrado ID:', userIdInt);
      return NextResponse.json({ 
        error: 'Unauthorized - User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 401 });
    }

    const user = userResult[0];
    console.log('✅ Usuário encontrado:', user.name);

    // Get user permissions
    let permissions: any[] = [];
    try {
      // 1. Try to find permissions by userId directly (new system)
      const directPerms = await db
        .select({
          key: memberPermissions.permissionKey,
          granted: memberPermissions.granted,
        })
        .from(memberPermissions)
        .where(eq(memberPermissions.userId, userIdInt));

      if (directPerms.length > 0) {
        permissions = directPerms.map(p => ({
          key: p.key,
          granted: Boolean(p.granted)
        }));
      } else {
        // 2. Fallback: find member by email (legacy/sync system)
        const memberResult = await db
          .select({ id: members.id })
          .from(members)
          .where(eq(members.email, user.email || ''))
          .limit(1);

        if (memberResult.length > 0) {
          const memberId = memberResult[0].id;
          const permsResult = await db
            .select({
              key: memberPermissions.permissionKey,
              granted: memberPermissions.granted,
            })
            .from(memberPermissions)
            .where(eq(memberPermissions.memberId, memberId));

          permissions = permsResult.map(p => ({
            key: p.key,
            granted: Boolean(p.granted)
          }));
        }
      }
    } catch (e) {
      console.error('Error fetching permissions:', e);
      permissions = [];
    }

    // Format response - return user object directly
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      congregationId: user.congregationId,
      hasGeneralAccess: user.hasGeneralAccess || false,
      congregation: user.congregation && user.congregation.id ? {
        id: user.congregation.id,
        name: user.congregation.name,
        city: user.congregation.city,
        state: user.congregation.state,
        address: user.congregation.address,
        isHeadquarters: user.congregation.isHeadquarters,
      } : null,
      permissions: permissions.filter(p => p.granted).map(p => p.key),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json({ user: userData }, { status: 200 });

  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

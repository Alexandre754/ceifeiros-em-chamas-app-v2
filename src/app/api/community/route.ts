import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { communityPosts, users, congregations } from '@/db/schema';
import { eq, like, and, or, desc, sql } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ipcecma-secret-key-2024';

interface JWTPayload {
  userId: number;
  role: string;
  congregationId: number | null;
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

    const { userId, role, congregationId: userCongregationId } = tokenPayload;

    const userWithCongregation = await db
      .select({
        id: users.id,
        congregationId: users.congregationId,
        role: users.role,
        isHeadquarters: congregations.isHeadquarters,
      })
      .from(users)
      .leftJoin(congregations, eq(users.congregationId, congregations.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (userWithCongregation.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const user = userWithCongregation[0];
    const isHeadquarters = user.isHeadquarters ?? false;

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const congregationIdFilter = searchParams.get('congregationId');
    const typeFilter = searchParams.get('type');

    let query = db
      .select({
        id: communityPosts.id,
        congregationId: communityPosts.congregationId,
        userId: communityPosts.userId,
        type: communityPosts.type,
        title: communityPosts.title,
        content: communityPosts.content,
        prayersCount: communityPosts.prayersCount,
        likesCount: communityPosts.likesCount,
        commentsCount: communityPosts.commentsCount,
        status: communityPosts.status,
        createdAt: communityPosts.createdAt,
        updatedAt: communityPosts.updatedAt,
        congregation: {
          id: congregations.id,
          name: congregations.name,
          city: congregations.city,
          state: congregations.state,
          isHeadquarters: congregations.isHeadquarters,
        },
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        },
      })
      .from(communityPosts)
      .leftJoin(congregations, eq(communityPosts.congregationId, congregations.id))
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .$dynamic();

    const conditions = [];

    const canViewAllCongregations =
      role === 'admin_geral' || (role === 'admin_sede' && isHeadquarters);

    if (!canViewAllCongregations) {
      if (user.congregationId) {
        conditions.push(eq(communityPosts.congregationId, user.congregationId));
      } else {
        return NextResponse.json(
          {
            error: 'User has no assigned congregation',
            code: 'NO_CONGREGATION',
          },
          { status: 403 }
        );
      }
    }

    if (congregationIdFilter) {
      const requestedCongregationId = parseInt(congregationIdFilter);
      if (!isNaN(requestedCongregationId)) {
        if (!canViewAllCongregations) {
          if (user.congregationId !== requestedCongregationId) {
            return NextResponse.json(
              {
                error: 'Access denied to this congregation',
                code: 'FORBIDDEN_CONGREGATION',
              },
              { status: 403 }
            );
          }
        }
        conditions.push(eq(communityPosts.congregationId, requestedCongregationId));
      }
    }

    if (typeFilter) {
      const validTypes = ['prayer', 'testimony', 'forum'];
      if (validTypes.includes(typeFilter)) {
        conditions.push(eq(communityPosts.type, typeFilter));
      }
    }

    if (search) {
      const searchCondition = or(
        like(communityPosts.title, `%${search}%`),
        like(communityPosts.content, `%${search}%`)
      );
      conditions.push(searchCondition);
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const posts = await query.orderBy(desc(communityPosts.createdAt)).limit(limit).offset(offset);

    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(communityPosts)
      .$dynamic();

    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }

    const totalResult = await countQuery;
    const total = totalResult[0]?.count ?? 0;

    return NextResponse.json({
      posts,
      total,
      userRole: role,
      userCongregationId: user.congregationId,
    });
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
    const tokenPayload = verifyToken(request);
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { userId, role, congregationId: userCongregationId } = tokenPayload;

    const requestBody = await request.json();

    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json(
        {
          error: 'User ID cannot be provided in request body',
          code: 'USER_ID_NOT_ALLOWED',
        },
        { status: 400 }
      );
    }

    const { congregationId, type, title, content } = requestBody;

    if (!congregationId) {
      return NextResponse.json(
        {
          error: 'congregationId is required',
          code: 'MISSING_CONGREGATION_ID',
        },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: 'type is required', code: 'MISSING_TYPE' },
        { status: 400 }
      );
    }

    const validTypes = ['prayer', 'testimony', 'forum'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          error: "type must be 'prayer', 'testimony', or 'forum'",
          code: 'INVALID_TYPE',
        },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'content is required and must be a non-empty string',
          code: 'INVALID_CONTENT',
        },
        { status: 400 }
      );
    }

    // Make title optional - use default if not provided
    const finalTitle = title && typeof title === 'string' && title.trim().length > 0 
      ? title.trim() 
      : (type === 'prayer' ? 'Pedido de Oração' : 'Testemunho');

    const congregationExists = await db
      .select({ id: congregations.id })
      .from(congregations)
      .where(eq(congregations.id, parseInt(congregationId)))
      .limit(1);

    if (congregationExists.length === 0) {
      return NextResponse.json(
        {
          error: 'Congregation not found',
          code: 'CONGREGATION_NOT_FOUND',
        },
        { status: 400 }
      );
    }

    const userWithCongregation = await db
      .select({
        id: users.id,
        congregationId: users.congregationId,
        role: users.role,
        approved: users.approved,
        isHeadquarters: congregations.isHeadquarters,
      })
      .from(users)
      .leftJoin(congregations, eq(users.congregationId, congregations.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (userWithCongregation.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const user = userWithCongregation[0];
    
    // Check if user is approved
    if (!user.approved) {
      return NextResponse.json(
        { error: 'User account is not approved', code: 'USER_NOT_APPROVED' },
        { status: 403 }
      );
    }

    const isHeadquarters = user.isHeadquarters ?? false;

    const canPostToAnyCongregation =
      role === 'admin_geral' || (role === 'admin_sede' && isHeadquarters);

    if (!canPostToAnyCongregation) {
      if (user.congregationId !== parseInt(congregationId)) {
        return NextResponse.json(
          {
            error: 'You can only post to your own congregation',
            code: 'FORBIDDEN_CONGREGATION',
          },
          { status: 403 }
        );
      }
    }

    const now = new Date().toISOString();

    const newPost = await db
      .insert(communityPosts)
      .values({
        congregationId: parseInt(congregationId),
        userId: userId,
        type: type.trim(),
        title: finalTitle,
        content: content.trim(),
        prayersCount: 0,
        likesCount: 0,
        commentsCount: 0,
        status: 'ativo',
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const createdPost = await db
      .select({
        id: communityPosts.id,
        congregationId: communityPosts.congregationId,
        userId: communityPosts.userId,
        type: communityPosts.type,
        title: communityPosts.title,
        content: communityPosts.content,
        prayersCount: communityPosts.prayersCount,
        likesCount: communityPosts.likesCount,
        commentsCount: communityPosts.commentsCount,
        status: communityPosts.status,
        createdAt: communityPosts.createdAt,
        updatedAt: communityPosts.updatedAt,
        congregation: {
          id: congregations.id,
          name: congregations.name,
          city: congregations.city,
          state: congregations.state,
          isHeadquarters: congregations.isHeadquarters,
        },
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        },
      })
      .from(communityPosts)
      .leftJoin(congregations, eq(communityPosts.congregationId, congregations.id))
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .where(eq(communityPosts.id, newPost[0].id))
      .limit(1);

    return NextResponse.json(createdPost[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
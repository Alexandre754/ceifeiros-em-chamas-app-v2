import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sermons, users, congregations } from '@/db/schema';
import { eq, like, and, or, desc, gte, lte, sql } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ipcecma-secret-key-2024';

interface JwtPayload {
  userId: number;
  role: string;
  congregationId: number | null;
}

function verifyToken(request: NextRequest): JwtPayload | null {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const tokenPayload = verifyToken(request);
    if (!tokenPayload) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const congregationIdParam = searchParams.get('congregationId');
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const userWithCongregation = await db.select({
      id: users.id,
      role: users.role,
      congregationId: users.congregationId,
      isHeadquarters: congregations.isHeadquarters
    })
      .from(users)
      .leftJoin(congregations, eq(users.congregationId, congregations.id))
      .where(eq(users.id, tokenPayload.userId))
      .limit(1);

    if (userWithCongregation.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 404 });
    }

    const user = userWithCongregation[0];
    const canViewAll = user.role === 'admin_geral' || 
                       (user.role === 'admin_sede' && user.isHeadquarters === true);

    const conditions = [];

    if (!canViewAll && user.congregationId) {
      conditions.push(eq(sermons.congregationId, user.congregationId));
    }

    if (congregationIdParam) {
      const requestedCongregationId = parseInt(congregationIdParam);
      if (!canViewAll && user.congregationId !== requestedCongregationId) {
        return NextResponse.json({ 
          error: 'Forbidden: Cannot access sermons from other congregations',
          code: 'FORBIDDEN' 
        }, { status: 403 });
      }
      conditions.push(eq(sermons.congregationId, requestedCongregationId));
    }

    if (search) {
      const searchCondition = or(
        like(sermons.title, `%${search}%`),
        like(sermons.preacher, `%${search}%`),
        like(sermons.category, `%${search}%`)
      );
      conditions.push(searchCondition);
    }

    if (category) {
      conditions.push(eq(sermons.category, category));
    }

    if (startDate) {
      conditions.push(gte(sermons.date, startDate));
    }

    if (endDate) {
      conditions.push(lte(sermons.date, endDate));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const sermonsQuery = db.select({
      id: sermons.id,
      congregationId: sermons.congregationId,
      title: sermons.title,
      preacher: sermons.preacher,
      date: sermons.date,
      duration: sermons.duration,
      category: sermons.category,
      description: sermons.description,
      mediaUrl: sermons.mediaUrl,
      mediaType: sermons.mediaType,
      thumbnailUrl: sermons.thumbnailUrl,
      views: sermons.views,
      downloads: sermons.downloads,
      createdBy: sermons.createdBy,
      status: sermons.status,
      createdAt: sermons.createdAt,
      updatedAt: sermons.updatedAt,
      congregation: {
        id: congregations.id,
        name: congregations.name,
        city: congregations.city,
        state: congregations.state,
        isHeadquarters: congregations.isHeadquarters
      },
      creator: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role
      }
    })
      .from(sermons)
      .leftJoin(congregations, eq(sermons.congregationId, congregations.id))
      .leftJoin(users, eq(sermons.createdBy, users.id))
      .where(whereCondition)
      .orderBy(desc(sermons.date), desc(sermons.createdAt))
      .limit(limit)
      .offset(offset);

    const results = await sermonsQuery;

    const countQuery = await db.select({ count: sql<number>`count(*)` })
      .from(sermons)
      .where(whereCondition);

    const total = countQuery[0]?.count ?? 0;

    return NextResponse.json({
      sermons: results,
      total,
      userRole: user.role,
      userCongregationId: user.congregationId
    }, { status: 200 });

  } catch (error) {
    console.error('GET sermons error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tokenPayload = verifyToken(request);
    if (!tokenPayload) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const userWithCongregation = await db.select({
      id: users.id,
      role: users.role,
      congregationId: users.congregationId,
      isHeadquarters: congregations.isHeadquarters
    })
      .from(users)
      .leftJoin(congregations, eq(users.congregationId, congregations.id))
      .where(eq(users.id, tokenPayload.userId))
      .limit(1);

    if (userWithCongregation.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 404 });
    }

    const user = userWithCongregation[0];

    if (user.role === 'membro') {
      return NextResponse.json({ 
        error: 'Forbidden: Members cannot create sermons',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    const body = await request.json();

    if ('createdBy' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { 
      congregationId, 
      title, 
      preacher, 
      date,
      duration,
      category,
      description,
      mediaUrl,
      mediaType,
      thumbnailUrl
    } = body;

    if (!congregationId) {
      return NextResponse.json({ 
        error: "congregationId is required",
        code: "MISSING_CONGREGATION_ID" 
      }, { status: 400 });
    }

    if (!title || title.trim() === '') {
      return NextResponse.json({ 
        error: "title is required and cannot be empty",
        code: "MISSING_TITLE" 
      }, { status: 400 });
    }

    if (!preacher || preacher.trim() === '') {
      return NextResponse.json({ 
        error: "preacher is required and cannot be empty",
        code: "MISSING_PREACHER" 
      }, { status: 400 });
    }

    if (!date || date.trim() === '') {
      return NextResponse.json({ 
        error: "date is required",
        code: "MISSING_DATE" 
      }, { status: 400 });
    }

    const congregationExists = await db.select({ id: congregations.id })
      .from(congregations)
      .where(eq(congregations.id, parseInt(congregationId)))
      .limit(1);

    if (congregationExists.length === 0) {
      return NextResponse.json({ 
        error: "Congregation not found",
        code: "CONGREGATION_NOT_FOUND" 
      }, { status: 400 });
    }

    const canCreateForAnyCongregation = user.role === 'admin_geral' || 
                                        (user.role === 'admin_sede' && user.isHeadquarters === true);

    if (!canCreateForAnyCongregation && user.congregationId !== parseInt(congregationId)) {
      return NextResponse.json({ 
        error: 'Forbidden: Can only create sermons for your own congregation',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    if (mediaType && mediaType !== 'video' && mediaType !== 'audio') {
      return NextResponse.json({ 
        error: "mediaType must be 'video' or 'audio'",
        code: "INVALID_MEDIA_TYPE" 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    const newSermon = await db.insert(sermons)
      .values({
        congregationId: parseInt(congregationId),
        title: title.trim(),
        preacher: preacher.trim(),
        date: date.trim(),
        duration: duration ? duration.trim() : null,
        category: category ? category.trim() : null,
        description: description ? description.trim() : null,
        mediaUrl: mediaUrl ? mediaUrl.trim() : null,
        mediaType: mediaType ? mediaType.trim() : null,
        thumbnailUrl: thumbnailUrl ? thumbnailUrl.trim() : null,
        views: 0,
        downloads: 0,
        createdBy: user.id,
        status: 'ativo',
        createdAt: now,
        updatedAt: now
      })
      .returning();

    const createdSermon = await db.select({
      id: sermons.id,
      congregationId: sermons.congregationId,
      title: sermons.title,
      preacher: sermons.preacher,
      date: sermons.date,
      duration: sermons.duration,
      category: sermons.category,
      description: sermons.description,
      mediaUrl: sermons.mediaUrl,
      mediaType: sermons.mediaType,
      thumbnailUrl: sermons.thumbnailUrl,
      views: sermons.views,
      downloads: sermons.downloads,
      createdBy: sermons.createdBy,
      status: sermons.status,
      createdAt: sermons.createdAt,
      updatedAt: sermons.updatedAt,
      congregation: {
        id: congregations.id,
        name: congregations.name,
        city: congregations.city,
        state: congregations.state,
        isHeadquarters: congregations.isHeadquarters
      },
      creator: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role
      }
    })
      .from(sermons)
      .leftJoin(congregations, eq(sermons.congregationId, congregations.id))
      .leftJoin(users, eq(sermons.createdBy, users.id))
      .where(eq(sermons.id, newSermon[0].id))
      .limit(1);

    return NextResponse.json(createdSermon[0], { status: 201 });

  } catch (error) {
    console.error('POST sermons error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}
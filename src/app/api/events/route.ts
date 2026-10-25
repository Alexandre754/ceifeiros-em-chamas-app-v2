import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { events, users, congregations } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: number;
  role: string;
  congregationId?: number;
}

interface UserWithCongregation {
  id: number;
  name: string;
  email: string;
  role: string;
  congregationId: number | null;
  congregation: {
    id: number;
    name: string;
    isHeadquarters: boolean | null;
  } | null;
}

async function verifyToken(request: NextRequest): Promise<{ user: UserWithCongregation; congregation: any } | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'ipcecma-secret-key-2024';
    
    const decoded = jwt.verify(token, secret) as JWTPayload;
    
    const userResult = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      congregationId: users.congregationId,
      congregation: {
        id: congregations.id,
        name: congregations.name,
        isHeadquarters: congregations.isHeadquarters,
      }
    })
    .from(users)
    .leftJoin(congregations, eq(users.congregationId, congregations.id))
    .where(eq(users.id, decoded.userId))
    .limit(1);

    if (userResult.length === 0) {
      return null;
    }

    const user = userResult[0];
    
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        congregationId: user.congregationId,
        congregation: user.congregation
      },
      congregation: user.congregation
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    if (!authResult) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const { user, congregation } = authResult;
    const { searchParams } = new URL(request.url);

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const congregationIdParam = searchParams.get('congregationId');

    let query = db.select({
      id: events.id,
      congregationId: events.congregationId,
      title: events.title,
      description: events.description,
      startDate: events.startDate,
      startTime: events.startTime,
      endDate: events.endDate,
      endTime: events.endTime,
      day1Date: events.day1Date,
      day1Time: events.day1Time,
      day2Date: events.day2Date,
      day2Time: events.day2Time,
      day3Date: events.day3Date,
      day3Time: events.day3Time,
      location: events.location,
      mediaUrl: events.mediaUrl,
      mediaType: events.mediaType,
      category: events.category,
      attendance: events.attendance,
      createdBy: events.createdBy,
      status: events.status,
      createdAt: events.createdAt,
      updatedAt: events.updatedAt,
      congregation: {
        id: congregations.id,
        name: congregations.name,
        city: congregations.city,
        state: congregations.state,
      },
      creator: {
        id: users.id,
        name: users.name,
        email: users.email,
      }
    })
    .from(events)
    .leftJoin(congregations, eq(events.congregationId, congregations.id))
    .leftJoin(users, eq(events.createdBy, users.id));

    const conditions = [];

    const isAdminGeral = user.role === 'admin_geral';
    const isAdminSedeHeadquarters = user.role === 'admin_sede' && congregation?.isHeadquarters === true;
    const canViewAllEvents = isAdminGeral || isAdminSedeHeadquarters;

    if (!canViewAllEvents) {
      if (user.congregationId) {
        conditions.push(eq(events.congregationId, user.congregationId));
      } else {
        return NextResponse.json({ 
          events: [], 
          total: 0, 
          userRole: user.role,
          userCongregationId: user.congregationId 
        }, { status: 200 });
      }
    }

    if (congregationIdParam) {
      const targetCongregationId = parseInt(congregationIdParam);
      if (!canViewAllEvents && targetCongregationId !== user.congregationId) {
        return NextResponse.json({ 
          error: 'You can only view events from your congregation',
          code: 'FORBIDDEN' 
        }, { status: 403 });
      }
      conditions.push(eq(events.congregationId, targetCongregationId));
    }

    if (search) {
      conditions.push(
        or(
          like(events.title, `%${search}%`),
          like(events.description, `%${search}%`),
          like(events.location, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query.orderBy(desc(events.startDate)).limit(limit).offset(offset);

    let countQuery = db.select({ count: events.id }).from(events);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions)) as any;
    }
    const countResult = await countQuery;
    const total = countResult.length;

    return NextResponse.json({
      events: results,
      total,
      userRole: user.role,
      userCongregationId: user.congregationId
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    if (!authResult) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const { user, congregation } = authResult;

    if (user.role === 'membro') {
      return NextResponse.json({ 
        error: 'You do not have permission to create events',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { 
      congregationId, 
      title, 
      description, 
      startDate, 
      startTime, 
      endDate, 
      endTime,
      day1Date,
      day1Time,
      day2Date,
      day2Time,
      day3Date,
      day3Time,
      location,
      mediaUrl,
      mediaType,
      category,
      attendance
    } = body;

    if (!congregationId) {
      return NextResponse.json({ 
        error: 'Congregation ID is required',
        code: 'MISSING_CONGREGATION_ID' 
      }, { status: 400 });
    }

    if (!title || !title.trim()) {
      return NextResponse.json({ 
        error: 'Title is required',
        code: 'MISSING_TITLE' 
      }, { status: 400 });
    }

    if (!description || !description.trim()) {
      return NextResponse.json({ 
        error: 'Description is required',
        code: 'MISSING_DESCRIPTION' 
      }, { status: 400 });
    }

    if (!startDate || !startTime) {
      return NextResponse.json({ 
        error: 'Start date and time are required',
        code: 'MISSING_START_DATETIME' 
      }, { status: 400 });
    }

    if (!endDate || !endTime) {
      return NextResponse.json({ 
        error: 'End date and time are required',
        code: 'MISSING_END_DATETIME' 
      }, { status: 400 });
    }

    const isAdminGeral = user.role === 'admin_geral';
    const isAdminSedeHeadquarters = user.role === 'admin_sede' && congregation?.isHeadquarters === true;
    const canCreateForAnyCongregation = isAdminGeral || isAdminSedeHeadquarters;

    if (!canCreateForAnyCongregation) {
      if (user.role === 'admin_congregacao') {
        if (congregationId !== user.congregationId) {
          return NextResponse.json({ 
            error: 'You can only create events for your own congregation',
            code: 'FORBIDDEN' 
          }, { status: 403 });
        }
      }
    }

    if (mediaType && mediaType !== 'image' && mediaType !== 'video') {
      return NextResponse.json({ 
        error: 'Media type must be either "image" or "video"',
        code: 'INVALID_MEDIA_TYPE' 
      }, { status: 400 });
    }

    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);

    if (startDateTime > endDateTime) {
      return NextResponse.json({ 
        error: 'Start date must be before or equal to end date',
        code: 'INVALID_DATE_RANGE' 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    const newEvent = await db.insert(events)
      .values({
        congregationId: parseInt(congregationId),
        title: title.trim(),
        description: description.trim(),
        startDate: startDate.trim(),
        startTime: startTime.trim(),
        endDate: endDate.trim(),
        endTime: endTime.trim(),
        day1Date: day1Date ? day1Date.trim() : null,
        day1Time: day1Time ? day1Time.trim() : null,
        day2Date: day2Date ? day2Date.trim() : null,
        day2Time: day2Time ? day2Time.trim() : null,
        day3Date: day3Date ? day3Date.trim() : null,
        day3Time: day3Time ? day3Time.trim() : null,
        location: location ? location.trim() : null,
        mediaUrl: mediaUrl ? mediaUrl.trim() : null,
        mediaType: mediaType ? mediaType.trim() : null,
        category: category ? category.trim() : null,
        attendance: attendance ? parseInt(attendance) : null,
        createdBy: user.id,
        status: 'ativo',
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const eventWithDetails = await db.select({
      id: events.id,
      congregationId: events.congregationId,
      title: events.title,
      description: events.description,
      startDate: events.startDate,
      startTime: events.startTime,
      endDate: events.endDate,
      endTime: events.endTime,
      day1Date: events.day1Date,
      day1Time: events.day1Time,
      day2Date: events.day2Date,
      day2Time: events.day2Time,
      day3Date: events.day3Date,
      day3Time: events.day3Time,
      location: events.location,
      mediaUrl: events.mediaUrl,
      mediaType: events.mediaType,
      category: events.category,
      attendance: events.attendance,
      createdBy: events.createdBy,
      status: events.status,
      createdAt: events.createdAt,
      updatedAt: events.updatedAt,
      congregation: {
        id: congregations.id,
        name: congregations.name,
        city: congregations.city,
        state: congregations.state,
      },
      creator: {
        id: users.id,
        name: users.name,
        email: users.email,
      }
    })
    .from(events)
    .leftJoin(congregations, eq(events.congregationId, congregations.id))
    .leftJoin(users, eq(events.createdBy, users.id))
    .where(eq(events.id, newEvent[0].id))
    .limit(1);

    return NextResponse.json(eventWithDetails[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}
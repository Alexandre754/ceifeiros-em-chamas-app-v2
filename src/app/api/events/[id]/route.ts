import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { events, users, congregations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: number;
  role: string;
  congregationId?: number;
}

interface AuthUser {
  userId: number;
  role: string;
  congregationId?: number;
  isHeadquarters?: boolean;
}

async function verifyToken(request: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'ipcecma-secret-key-2024';
    
    const decoded = jwt.verify(token, secret) as JWTPayload;

    if (!decoded.userId || !decoded.role) {
      return null;
    }

    // Get user's congregation info if they have one
    if (decoded.congregationId) {
      const congregation = await db.select()
        .from(congregations)
        .where(eq(congregations.id, decoded.congregationId))
        .limit(1);

      return {
        userId: decoded.userId,
        role: decoded.role,
        congregationId: decoded.congregationId,
        isHeadquarters: congregation[0]?.isHeadquarters || false
      };
    }

    return {
      userId: decoded.userId,
      role: decoded.role,
      congregationId: decoded.congregationId
    };
  } catch (error) {
    return null;
  }
}

function canAccessEvent(user: AuthUser, event: any): boolean {
  // admin_geral has full access
  if (user.role === 'admin_geral') {
    return true;
  }

  // admin_sede (headquarters) has full access
  if (user.role === 'admin_sede' && user.isHeadquarters) {
    return true;
  }

  // admin_congregacao and membro can only access events from their congregation
  if ((user.role === 'admin_congregacao' || user.role === 'membro') && user.congregationId) {
    return event.congregationId === user.congregationId;
  }

  return false;
}

function canModifyEvent(user: AuthUser, event: any): boolean {
  // membro cannot modify events
  if (user.role === 'membro') {
    return false;
  }

  // admin_geral has full access
  if (user.role === 'admin_geral') {
    return true;
  }

  // admin_sede (headquarters) has full access
  if (user.role === 'admin_sede' && user.isHeadquarters) {
    return true;
  }

  // admin_congregacao can only modify events from their congregation
  if (user.role === 'admin_congregacao' && user.congregationId) {
    return event.congregationId === user.congregationId;
  }

  return false;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Validate ID
    const params = await context.params;
    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Query event with joins
    const result = await db.select({
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
        isHeadquarters: congregations.isHeadquarters
      },
      creator: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role
      }
    })
      .from(events)
      .leftJoin(congregations, eq(events.congregationId, congregations.id))
      .leftJoin(users, eq(events.createdBy, users.id))
      .where(eq(events.id, parseInt(id)))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const event = result[0];

    // Check if user has permission to view this event
    if (!canAccessEvent(user, event)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to access this event', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    return NextResponse.json(event, { status: 200 });
  } catch (error) {
    console.error('GET event error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Validate ID
    const params = await context.params;
    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if event exists
    const existingEvent = await db.select()
      .from(events)
      .where(eq(events.id, parseInt(id)))
      .limit(1);

    if (existingEvent.length === 0) {
      return NextResponse.json(
        { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const event = existingEvent[0];

    // Check if user has permission to modify this event
    if (!canModifyEvent(user, event)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to modify this event', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const updates: any = {};

    // Validate and trim string inputs
    if (body.title !== undefined) {
      updates.title = body.title.trim();
      if (!updates.title) {
        return NextResponse.json(
          { error: 'Title cannot be empty', code: 'INVALID_TITLE' },
          { status: 400 }
        );
      }
    }

    if (body.description !== undefined) {
      updates.description = body.description.trim();
      if (!updates.description) {
        return NextResponse.json(
          { error: 'Description cannot be empty', code: 'INVALID_DESCRIPTION' },
          { status: 400 }
        );
      }
    }

    if (body.startDate !== undefined) {
      updates.startDate = body.startDate.trim();
    }

    if (body.startTime !== undefined) {
      updates.startTime = body.startTime.trim();
    }

    if (body.endDate !== undefined) {
      updates.endDate = body.endDate.trim();
    }

    if (body.endTime !== undefined) {
      updates.endTime = body.endTime.trim();
    }

    if (body.day1Date !== undefined) {
      updates.day1Date = body.day1Date ? body.day1Date.trim() : null;
    }

    if (body.day1Time !== undefined) {
      updates.day1Time = body.day1Time ? body.day1Time.trim() : null;
    }

    if (body.day2Date !== undefined) {
      updates.day2Date = body.day2Date ? body.day2Date.trim() : null;
    }

    if (body.day2Time !== undefined) {
      updates.day2Time = body.day2Time ? body.day2Time.trim() : null;
    }

    if (body.day3Date !== undefined) {
      updates.day3Date = body.day3Date ? body.day3Date.trim() : null;
    }

    if (body.day3Time !== undefined) {
      updates.day3Time = body.day3Time ? body.day3Time.trim() : null;
    }

    // Validate date logic if both dates are provided
    if (updates.startDate && updates.endDate) {
      const start = new Date(updates.startDate);
      const end = new Date(updates.endDate);
      if (start > end) {
        return NextResponse.json(
          { error: 'Start date must be before or equal to end date', code: 'INVALID_DATE_RANGE' },
          { status: 400 }
        );
      }
    }

    if (body.location !== undefined) {
      updates.location = body.location ? body.location.trim() : null;
    }

    if (body.mediaUrl !== undefined) {
      updates.mediaUrl = body.mediaUrl ? body.mediaUrl.trim() : null;
    }

    if (body.mediaType !== undefined) {
      if (body.mediaType && !['image', 'video'].includes(body.mediaType)) {
        return NextResponse.json(
          { error: 'Media type must be either "image" or "video"', code: 'INVALID_MEDIA_TYPE' },
          { status: 400 }
        );
      }
      updates.mediaType = body.mediaType;
    }

    if (body.category !== undefined) {
      updates.category = body.category ? body.category.trim() : null;
    }

    if (body.attendance !== undefined) {
      updates.attendance = body.attendance;
    }

    if (body.status !== undefined) {
      updates.status = body.status.trim();
    }

    if (body.congregationId !== undefined) {
      // Verify congregation exists
      const congregation = await db.select()
        .from(congregations)
        .where(eq(congregations.id, body.congregationId))
        .limit(1);

      if (congregation.length === 0) {
        return NextResponse.json(
          { error: 'Congregation not found', code: 'CONGREGATION_NOT_FOUND' },
          { status: 400 }
        );
      }

      updates.congregationId = body.congregationId;
    }

    // Auto-update timestamp
    updates.updatedAt = new Date().toISOString();

    // Perform update
    const updated = await db.update(events)
      .set(updates)
      .where(eq(events.id, parseInt(id)))
      .returning();

    // Fetch updated event with joins
    const result = await db.select({
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
        isHeadquarters: congregations.isHeadquarters
      },
      creator: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role
      }
    })
      .from(events)
      .leftJoin(congregations, eq(events.congregationId, congregations.id))
      .leftJoin(users, eq(events.createdBy, users.id))
      .where(eq(events.id, parseInt(id)))
      .limit(1);

    return NextResponse.json(result[0], { status: 200 });
  } catch (error) {
    console.error('PUT event error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Validate ID
    const params = await context.params;
    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if event exists
    const existingEvent = await db.select()
      .from(events)
      .where(eq(events.id, parseInt(id)))
      .limit(1);

    if (existingEvent.length === 0) {
      return NextResponse.json(
        { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const event = existingEvent[0];

    // Check if user has permission to delete this event
    if (!canModifyEvent(user, event)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this event', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Perform soft delete
    await db.update(events)
      .set({
        status: 'inativo',
        updatedAt: new Date().toISOString()
      })
      .where(eq(events.id, parseInt(id)));

    return NextResponse.json(
      {
        message: 'Event deleted successfully',
        id: parseInt(id)
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE event error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
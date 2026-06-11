import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sermons, users, congregations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ipcecma-secret-key-2024';

interface JWTPayload {
  userId: number;
  role: string;
  congregationId: number;
}

interface RouteParams {
  params: { id: string };
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

async function checkPermission(
  user: JWTPayload,
  sermonCongregationId: number,
  action: 'view' | 'modify' | 'delete'
): Promise<{ allowed: boolean; error?: string }> {
  // admin_geral has full access
  if (user.role === 'admin_geral') {
    return { allowed: true };
  }

  // Check if user is from headquarters
  const userCongregation = await db.select()
    .from(congregations)
    .where(eq(congregations.id, user.congregationId))
    .limit(1);

  const isHeadquarters = userCongregation[0]?.isHeadquarters || false;

  // admin_sede from headquarters has full access
  if (user.role === 'admin_sede' && isHeadquarters) {
    return { allowed: true };
  }

  // Check congregation match
  if (user.congregationId !== sermonCongregationId) {
    return { 
      allowed: false, 
      error: 'You do not have permission to access sermons from other congregations' 
    };
  }

  // admin_congregacao can view/modify/delete from their congregation
  if (user.role === 'admin_congregacao') {
    return { allowed: true };
  }

  // membro can only view
  if (user.role === 'membro') {
    if (action === 'view') {
      return { allowed: true };
    }
    return { 
      allowed: false, 
      error: 'Members do not have permission to modify or delete sermons' 
    };
  }

  return { 
    allowed: false, 
    error: 'Insufficient permissions' 
  };
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid sermon ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const sermonId = parseInt(id);

    const sermonResult = await db.select({
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
        address: congregations.address,
        isHeadquarters: congregations.isHeadquarters,
      },
      creator: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      },
    })
      .from(sermons)
      .leftJoin(congregations, eq(sermons.congregationId, congregations.id))
      .leftJoin(users, eq(sermons.createdBy, users.id))
      .where(eq(sermons.id, sermonId))
      .limit(1);

    if (sermonResult.length === 0) {
      return NextResponse.json(
        { error: 'Sermon not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const sermon = sermonResult[0];

    const permissionCheck = await checkPermission(user, sermon.congregationId, 'view');
    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.error, code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    await db.update(sermons)
      .set({ 
        views: (sermon.views || 0) + 1,
        updatedAt: new Date().toISOString()
      })
      .where(eq(sermons.id, sermonId));

    return NextResponse.json({
      ...sermon,
      views: (sermon.views || 0) + 1,
    });

  } catch (error) {
    console.error('GET sermon error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid sermon ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const sermonId = parseInt(id);

    const existingSermon = await db.select()
      .from(sermons)
      .where(eq(sermons.id, sermonId))
      .limit(1);

    if (existingSermon.length === 0) {
      return NextResponse.json(
        { error: 'Sermon not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const sermon = existingSermon[0];

    const permissionCheck = await checkPermission(user, sermon.congregationId, 'modify');
    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.error, code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (body.mediaType && body.mediaType !== 'video' && body.mediaType !== 'audio') {
      return NextResponse.json(
        { error: 'Media type must be either "video" or "audio"', code: 'INVALID_MEDIA_TYPE' },
        { status: 400 }
      );
    }

    if (body.title !== undefined && (!body.title || body.title.trim() === '')) {
      return NextResponse.json(
        { error: 'Title cannot be empty', code: 'INVALID_TITLE' },
        { status: 400 }
      );
    }

    if (body.preacher !== undefined && (!body.preacher || body.preacher.trim() === '')) {
      return NextResponse.json(
        { error: 'Preacher cannot be empty', code: 'INVALID_PREACHER' },
        { status: 400 }
      );
    }

    if (body.date !== undefined && (!body.date || body.date.trim() === '')) {
      return NextResponse.json(
        { error: 'Date cannot be empty', code: 'INVALID_DATE' },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.preacher !== undefined) updateData.preacher = body.preacher.trim();
    if (body.date !== undefined) updateData.date = body.date.trim();
    if (body.duration !== undefined) updateData.duration = body.duration;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.description !== undefined) updateData.description = body.description?.trim();
    if (body.mediaUrl !== undefined) updateData.mediaUrl = body.mediaUrl;
    if (body.mediaType !== undefined) updateData.mediaType = body.mediaType;
    if (body.thumbnailUrl !== undefined) updateData.thumbnailUrl = body.thumbnailUrl;
    if (body.status !== undefined) updateData.status = body.status;

    const updatedSermonResult = await db.update(sermons)
      .set(updateData)
      .where(eq(sermons.id, sermonId))
      .returning();

    const updatedSermon = await db.select({
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
        address: congregations.address,
        isHeadquarters: congregations.isHeadquarters,
      },
      creator: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      },
    })
      .from(sermons)
      .leftJoin(congregations, eq(sermons.congregationId, congregations.id))
      .leftJoin(users, eq(sermons.createdBy, users.id))
      .where(eq(sermons.id, sermonId))
      .limit(1);

    return NextResponse.json(updatedSermon[0]);

  } catch (error) {
    console.error('PUT sermon error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid sermon ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const sermonId = parseInt(id);

    const existingSermon = await db.select()
      .from(sermons)
      .where(eq(sermons.id, sermonId))
      .limit(1);

    if (existingSermon.length === 0) {
      return NextResponse.json(
        { error: 'Sermon not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const sermon = existingSermon[0];

    const permissionCheck = await checkPermission(user, sermon.congregationId, 'delete');
    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.error, code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    await db.update(sermons)
      .set({
        status: 'inativo',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sermons.id, sermonId))
      .returning();

    return NextResponse.json({
      message: 'Sermon deleted successfully',
      id: sermonId,
    });

  } catch (error) {
    console.error('DELETE sermon error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
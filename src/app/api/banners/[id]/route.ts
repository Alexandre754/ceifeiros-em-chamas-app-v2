import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { banners } from '@/db/schema';
import { eq } from 'drizzle-orm';
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

function canManageBanners(role: string): boolean {
  // Only admin_geral and admin_sede can manage banners
  return role === 'admin_geral' || role === 'admin_sede';
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const result = await db
      .select()
      .from(banners)
      .where(eq(banners.id, parseInt(id)))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Banner not found', code: 'BANNER_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('GET banner error:', error);
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
    const tokenPayload = verifyToken(request);
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Check permissions
    if (!canManageBanners(tokenPayload.role)) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions. Only administrators can update banners.',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    const params = await context.params;
    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if banner exists
    const existing = await db
      .select()
      .from(banners)
      .where(eq(banners.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Banner not found', code: 'BANNER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      imageUrl,
      linkUrl,
      order,
      active,
      startDate,
      endDate,
    } = body;

    // Validate title if provided
    if (title !== undefined) {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        return NextResponse.json(
          { error: 'Title cannot be empty', code: 'INVALID_TITLE' },
          { status: 400 }
        );
      }
    }

    // Validate imageUrl if provided
    if (imageUrl !== undefined) {
      const trimmedImageUrl = imageUrl.trim();
      if (!trimmedImageUrl) {
        return NextResponse.json(
          { error: 'Image URL cannot be empty', code: 'INVALID_IMAGE_URL' },
          { status: 400 }
        );
      }
    }

    // Validate date logic if both dates are provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        return NextResponse.json(
          {
            error: 'End date must be after start date',
            code: 'INVALID_DATE_RANGE',
          },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (title !== undefined) {
      updates.title = title.trim();
    }

    if (description !== undefined) {
      updates.description = description ? description.trim() : description;
    }

    if (imageUrl !== undefined) {
      updates.imageUrl = imageUrl.trim();
    }

    if (linkUrl !== undefined) {
      updates.linkUrl = linkUrl ? linkUrl.trim() : linkUrl;
    }

    if (order !== undefined) {
      updates.order = order;
    }

    if (active !== undefined) {
      updates.active = active;
    }

    if (startDate !== undefined) {
      updates.startDate = startDate;
    }

    if (endDate !== undefined) {
      updates.endDate = endDate;
    }

    // Update banner
    const updated = await db
      .update(banners)
      .set(updates)
      .where(eq(banners.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update banner', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('PUT banner error:', error);
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
    const tokenPayload = verifyToken(request);
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Check permissions
    if (!canManageBanners(tokenPayload.role)) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions. Only administrators can delete banners.',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    const params = await context.params;
    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if banner exists
    const existing = await db
      .select()
      .from(banners)
      .where(eq(banners.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Banner not found', code: 'BANNER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Hard delete the banner
    const deleted = await db
      .delete(banners)
      .where(eq(banners.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete banner', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Banner deleted successfully',
      id: parseInt(id),
    });
  } catch (error) {
    console.error('DELETE banner error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
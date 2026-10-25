import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { banners, users, congregations } from '@/db/schema';
import { eq, like, and, or, desc, asc } from 'drizzle-orm';
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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const showAll = searchParams.get('all') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');

    // Build query
    let query = db.select().from(banners);
    const conditions = [];

    // If not showing all, only return active banners
    if (!showAll) {
      conditions.push(eq(banners.active, true));
    }

    // Search functionality
    if (search) {
      const searchCondition = or(
        like(banners.title, `%${search}%`),
        like(banners.description, `%${search}%`)
      );
      conditions.push(searchCondition);
    }

    // Apply conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Order by 'order' field ASC, then by createdAt DESC
    query = (query as any)
      .orderBy(asc(banners.order), desc(banners.createdAt))
      .limit(limit)
      .offset(offset);

    const results = await query;

    // Get total count
    let countQuery = db.select().from(banners);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions)) as any;
    }
    const totalResult = await countQuery;
    const total = totalResult.length;

    return NextResponse.json({
      banners: results,
      total,
    });
  } catch (error) {
    console.error('GET banners error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
          error: 'Insufficient permissions. Only administrators can create banners.',
          code: 'FORBIDDEN',
        },
        { status: 403 }
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

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        {
          error: 'Title is required and must be a non-empty string',
          code: 'MISSING_TITLE',
        },
        { status: 400 }
      );
    }

    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
      return NextResponse.json(
        {
          error: 'Image URL is required and must be a non-empty string',
          code: 'MISSING_IMAGE_URL',
        },
        { status: 400 }
      );
    }

    // Validate date logic if both dates are provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime())) {
        return NextResponse.json(
          {
            error: 'Start date must be a valid date',
            code: 'INVALID_START_DATE',
          },
          { status: 400 }
        );
      }

      if (isNaN(end.getTime())) {
        return NextResponse.json(
          {
            error: 'End date must be a valid date',
            code: 'INVALID_END_DATE',
          },
          { status: 400 }
        );
      }

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

    const now = new Date().toISOString();

    // Prepare insert data
    const insertData: any = {
      title: title.trim(),
      imageUrl: imageUrl.trim(),
      order: order !== undefined ? parseInt(order.toString()) : 0,
      active: active !== undefined ? Boolean(active) : true,
      createdAt: now,
      updatedAt: now,
    };

    // Add optional fields
    if (description !== undefined && description !== null) {
      insertData.description =
        typeof description === 'string' ? description.trim() : description;
    }

    if (linkUrl !== undefined && linkUrl !== null) {
      insertData.linkUrl =
        typeof linkUrl === 'string' ? linkUrl.trim() : linkUrl;
    }

    if (startDate !== undefined && startDate !== null) {
      insertData.startDate = startDate;
    }

    if (endDate !== undefined && endDate !== null) {
      insertData.endDate = endDate;
    }

    // Insert into database
    const newBanner = await db.insert(banners).values(insertData).returning();

    if (newBanner.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create banner', code: 'CREATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(newBanner[0], { status: 201 });
  } catch (error) {
    console.error('POST banners error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
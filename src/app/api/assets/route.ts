import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assets, users, congregations } from '@/db/schema';
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

    // Query user with congregation join to check if isHeadquarters
    const userResult = await db
      .select({
        userId: users.id,
        role: users.role,
        congregationId: users.congregationId,
        isHeadquarters: congregations.isHeadquarters,
      })
      .from(users)
      .leftJoin(congregations, eq(users.congregationId, congregations.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const user = userResult[0];
    const isHeadquarters = user.isHeadquarters || false;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const filterCongregationId = searchParams.get('congregationId');
    const category = searchParams.get('category');
    const condition = searchParams.get('condition');

    // Build base query
    let whereConditions = [];

    // Apply congregation filtering based on role
    const canSeeAll =
      role === 'admin_geral' || (role === 'admin_sede' && isHeadquarters);

    if (!canSeeAll) {
      // admin_congregacao or membro: Filter by user's congregation only
      if (userCongregationId) {
        whereConditions.push(eq(assets.congregationId, userCongregationId));
      } else {
        // User has no congregation, return empty
        return NextResponse.json({
          assets: [],
          total: 0,
          userRole: role,
          userCongregationId: userCongregationId,
        });
      }
    }

    // Apply additional filters
    if (filterCongregationId) {
      const filterId = parseInt(filterCongregationId);
      if (!isNaN(filterId)) {
        // Check if user has permission to view this congregation
        if (!canSeeAll && filterId !== userCongregationId) {
          return NextResponse.json(
            {
              error: 'You do not have permission to view assets from this congregation',
              code: 'FORBIDDEN',
            },
            { status: 403 }
          );
        }
        whereConditions.push(eq(assets.congregationId, filterId));
      }
    }

    if (category) {
      whereConditions.push(eq(assets.category, category));
    }

    if (condition) {
      whereConditions.push(eq(assets.condition, condition));
    }

    // Apply search filter
    if (search) {
      const searchCondition = or(
        like(assets.name, `%${search}%`),
        like(assets.description, `%${search}%`),
        like(assets.serialNumber, `%${search}%`)
      );
      whereConditions.push(searchCondition);
    }

    // Build final where clause
    const finalWhere =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(assets);

    if (finalWhere) {
      countQuery.where(finalWhere);
    }

    const countResult = await countQuery;
    const total = countResult[0]?.count || 0;

    // Get assets with pagination
    let assetsQuery = db
      .select({
        id: assets.id,
        congregationId: assets.congregationId,
        name: assets.name,
        category: assets.category,
        subcategory: assets.subcategory,
        location: assets.location,
        propertyType: assets.propertyType,
        acquisitionDate: assets.acquisitionDate,
        acquisitionValue: assets.acquisitionValue,
        currentValue: assets.currentValue,
        condition: assets.condition,
        description: assets.description,
        serialNumber: assets.serialNumber,
        photoUrl: assets.photoUrl,
        status: assets.status,
        createdAt: assets.createdAt,
        updatedAt: assets.updatedAt,
        congregation: {
          id: congregations.id,
          name: congregations.name,
          city: congregations.city,
          state: congregations.state,
          address: congregations.address,
          isHeadquarters: congregations.isHeadquarters,
        },
      })
      .from(assets)
      .leftJoin(congregations, eq(assets.congregationId, congregations.id))
      .orderBy(desc(assets.createdAt))
      .limit(limit)
      .offset(offset);

    if (finalWhere) {
      assetsQuery = (assetsQuery as any).where(finalWhere);
    }

    const results = await assetsQuery;

    return NextResponse.json({
      assets: results,
      total,
      userRole: role,
      userCongregationId: userCongregationId,
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

    // Check if user can create assets (membro cannot)
    if (role === 'membro') {
      return NextResponse.json(
        {
          error: 'You do not have permission to create assets',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Query user with congregation join to check if isHeadquarters
    const userResult = await db
      .select({
        userId: users.id,
        role: users.role,
        congregationId: users.congregationId,
        isHeadquarters: congregations.isHeadquarters,
      })
      .from(users)
      .leftJoin(congregations, eq(users.congregationId, congregations.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const user = userResult[0];
    const isHeadquarters = user.isHeadquarters || false;

    const body = await request.json();

    // Validate required fields
    if (!body.congregationId) {
      return NextResponse.json(
        {
          error: 'congregationId is required',
          code: 'MISSING_CONGREGATION_ID',
        },
        { status: 400 }
      );
    }

    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'name is required and must be non-empty', code: 'INVALID_NAME' },
        { status: 400 }
      );
    }

    if (!body.category) {
      return NextResponse.json(
        { error: 'category is required', code: 'MISSING_CATEGORY' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['imovel', 'veiculo', 'equipamento', 'ferramenta'];
    if (!validCategories.includes(body.category)) {
      return NextResponse.json(
        {
          error: `category must be one of: ${validCategories.join(', ')}`,
          code: 'INVALID_CATEGORY',
        },
        { status: 400 }
      );
    }

    // Validate propertyType if provided and category is 'imovel'
    if (body.propertyType !== undefined && body.propertyType !== null) {
      if (body.category === 'imovel') {
        const validPropertyTypes = ['proprio', 'alugado'];
        if (!validPropertyTypes.includes(body.propertyType)) {
          return NextResponse.json(
            {
              error: `propertyType must be one of: ${validPropertyTypes.join(', ')}`,
              code: 'INVALID_PROPERTY_TYPE',
            },
            { status: 400 }
          );
        }
      }
    }

    // Validate condition if provided
    if (body.condition !== undefined && body.condition !== null) {
      const validConditions = ['otimo', 'bom', 'regular', 'ruim'];
      if (!validConditions.includes(body.condition)) {
        return NextResponse.json(
          {
            error: `condition must be one of: ${validConditions.join(', ')}`,
            code: 'INVALID_CONDITION',
          },
          { status: 400 }
        );
      }
    }

    // Validate acquisitionValue if provided
    if (body.acquisitionValue !== undefined && body.acquisitionValue !== null) {
      const acquisitionValue = parseFloat(body.acquisitionValue);
      if (isNaN(acquisitionValue) || acquisitionValue < 0) {
        return NextResponse.json(
          {
            error: 'acquisitionValue must be a non-negative number',
            code: 'INVALID_ACQUISITION_VALUE',
          },
          { status: 400 }
        );
      }
    }

    // Validate currentValue if provided
    if (body.currentValue !== undefined && body.currentValue !== null) {
      const currentValue = parseFloat(body.currentValue);
      if (isNaN(currentValue) || currentValue < 0) {
        return NextResponse.json(
          {
            error: 'currentValue must be a non-negative number',
            code: 'INVALID_CURRENT_VALUE',
          },
          { status: 400 }
        );
      }
    }

    // Verify congregationId exists
    const congregationExists = await db
      .select({ id: congregations.id })
      .from(congregations)
      .where(eq(congregations.id, parseInt(body.congregationId)))
      .limit(1);

    if (congregationExists.length === 0) {
      return NextResponse.json(
        { error: 'Congregation not found', code: 'CONGREGATION_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Check permission: admin_geral and headquarters admin_sede can create for any congregation
    const canCreateForAny =
      role === 'admin_geral' || (role === 'admin_sede' && isHeadquarters);

    if (!canCreateForAny) {
      // admin_congregacao can only create for their own congregation
      if (parseInt(body.congregationId) !== userCongregationId) {
        return NextResponse.json(
          {
            error: 'You can only create assets for your own congregation',
            code: 'FORBIDDEN',
          },
          { status: 403 }
        );
      }
    }

    // Sanitize and prepare data
    const now = new Date().toISOString();

    const insertData: any = {
      congregationId: parseInt(body.congregationId),
      name: body.name ? body.name.toString().trim() : '',
      category: body.category,
      status: 'ativo',
      createdAt: now,
      updatedAt: now,
    };

    // Optional fields
    if (body.subcategory !== undefined && body.subcategory !== null) {
      insertData.subcategory = body.subcategory.toString().trim();
    }

    if (body.location !== undefined && body.location !== null) {
      insertData.location = body.location.toString().trim();
    }

    if (body.propertyType !== undefined && body.propertyType !== null) {
      insertData.propertyType = body.propertyType;
    }

    if (body.acquisitionDate !== undefined && body.acquisitionDate !== null) {
      insertData.acquisitionDate = body.acquisitionDate;
    }

    if (body.acquisitionValue !== undefined && body.acquisitionValue !== null) {
      insertData.acquisitionValue = parseFloat(body.acquisitionValue.toString());
    }

    if (body.currentValue !== undefined && body.currentValue !== null) {
      insertData.currentValue = parseFloat(body.currentValue.toString());
    }

    if (body.condition !== undefined && body.condition !== null) {
      insertData.condition = body.condition;
    }

    if (body.description !== undefined && body.description !== null) {
      insertData.description = body.description.toString().trim();
    }

    if (body.serialNumber !== undefined && body.serialNumber !== null) {
      insertData.serialNumber = body.serialNumber.toString().trim();
    }

    if (body.photoUrl !== undefined && body.photoUrl !== null) {
      insertData.photoUrl = body.photoUrl.toString().trim();
    }

    // Insert asset
    const newAsset = await db.insert(assets).values(insertData).returning();

    if (newAsset.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create asset', code: 'CREATE_FAILED' },
        { status: 500 }
      );
    }

    // Fetch the created asset with congregation join
    const createdAsset = await db
      .select({
        id: assets.id,
        congregationId: assets.congregationId,
        name: assets.name,
        category: assets.category,
        subcategory: assets.subcategory,
        location: assets.location,
        propertyType: assets.propertyType,
        acquisitionDate: assets.acquisitionDate,
        acquisitionValue: assets.acquisitionValue,
        currentValue: assets.currentValue,
        condition: assets.condition,
        description: assets.description,
        serialNumber: assets.serialNumber,
        photoUrl: assets.photoUrl,
        status: assets.status,
        createdAt: assets.createdAt,
        updatedAt: assets.updatedAt,
        congregation: {
          id: congregations.id,
          name: congregations.name,
          city: congregations.city,
          state: congregations.state,
          address: congregations.address,
          isHeadquarters: congregations.isHeadquarters,
        },
      })
      .from(assets)
      .leftJoin(congregations, eq(assets.congregationId, congregations.id))
      .where(eq(assets.id, newAsset[0].id))
      .limit(1);

    return NextResponse.json(createdAsset[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
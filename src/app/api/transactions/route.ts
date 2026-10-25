import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions, users, congregations } from '@/db/schema';
import { eq, like, and, or, desc, gte, lte } from 'drizzle-orm';
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

    // Query user with congregation to check headquarters status and general access
    const userWithCongregation = await db
      .select({
        userId: users.id,
        userRole: users.role,
        userCongregationId: users.congregationId,
        hasGeneralAccess: users.hasGeneralAccess,
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

    const userData = userWithCongregation[0];
    const isHeadquarters = userData.isHeadquarters || false;
    const hasGeneralAccess = userData.hasGeneralAccess || false;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const filterCongregationId = searchParams.get('congregationId');
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build conditions array
    const conditions = [];

    // Apply congregation filtering based on role
    const isAdminGeral = role === 'admin_geral';
    const isAdminSedeHeadquarters = role === 'admin_sede' && isHeadquarters;
    const canSeeAll = isAdminGeral || isAdminSedeHeadquarters || hasGeneralAccess;

    if (!canSeeAll) {
      // admin_congregacao and membro can only see their own congregation
      if (userCongregationId) {
        conditions.push(eq(transactions.congregationId, userCongregationId));
      } else {
        // User has no congregation assigned - no results
        return NextResponse.json({
          transactions: [],
          total: 0,
          userRole: role,
          userCongregationId: userCongregationId,
        });
      }
    }

    // If specific congregationId filter provided, check permissions
    if (filterCongregationId) {
      const targetCongId = parseInt(filterCongregationId);
      if (!canSeeAll && targetCongId !== userCongregationId) {
        return NextResponse.json(
          {
            error: 'Insufficient permissions to view transactions for this congregation',
            code: 'FORBIDDEN',
          },
          { status: 403 }
        );
      }
      conditions.push(eq(transactions.congregationId, targetCongId));
    }

    // Search filter
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          like(transactions.description, searchTerm),
          like(transactions.category, searchTerm),
          like(transactions.titheGiverName, searchTerm)
        )
      );
    }

    // Type filter
    if (type && (type === 'entrada' || type === 'saida')) {
      conditions.push(eq(transactions.type, type));
    }

    // Category filter
    if (category) {
      conditions.push(eq(transactions.category, category));
    }

    // Date range filters
    if (startDate) {
      conditions.push(gte(transactions.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(transactions.date, endDate));
    }

    // Build query
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countQuery = db
      .select({ count: transactions.id })
      .from(transactions);
    
    if (whereClause) {
      countQuery.where(whereClause);
    }

    const totalResult = await countQuery;
    const total = totalResult.length;

    // Get transactions with joins
    const query = db
      .select({
        id: transactions.id,
        congregationId: transactions.congregationId,
        type: transactions.type,
        category: transactions.category,
        amount: transactions.amount,
        date: transactions.date,
        description: transactions.description,
        paymentMethod: transactions.paymentMethod,
        accountId: transactions.accountId,
        titheGiverName: transactions.titheGiverName,
        createdBy: transactions.createdBy,
        status: transactions.status,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        congregation: {
          id: congregations.id,
          name: congregations.name,
          city: congregations.city,
          state: congregations.state,
          isHeadquarters: congregations.isHeadquarters,
        },
        creator: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        },
      })
      .from(transactions)
      .leftJoin(congregations, eq(transactions.congregationId, congregations.id))
      .leftJoin(users, eq(transactions.createdBy, users.id));

    if (whereClause) {
      query.where(whereClause);
    }

    const results = await query
      .orderBy(desc(transactions.date), desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      transactions: results,
      total,
      userRole: role,
      userCongregationId: userCongregationId,
    });
  } catch (error) {
    console.error('GET transactions error:', error);
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

    // Check if user can create transactions (membro cannot)
    if (role === 'membro') {
      return NextResponse.json(
        {
          error: 'Insufficient permissions to create transactions',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Query user with congregation to check headquarters status
    const userWithCongregation = await db
      .select({
        userId: users.id,
        userRole: users.role,
        userCongregationId: users.congregationId,
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

    const userData = userWithCongregation[0];
    const isHeadquarters = userData.isHeadquarters || false;

    const body = await request.json();

    // Validate required fields
    const {
      congregationId,
      type,
      category,
      amount,
      date,
      description,
      paymentMethod,
      accountId,
      titheGiverName,
    } = body;

    if (!congregationId) {
      return NextResponse.json(
        { error: 'congregationId is required', code: 'MISSING_CONGREGATION_ID' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: 'type is required', code: 'MISSING_TYPE' },
        { status: 400 }
      );
    }

    if (type !== 'entrada' && type !== 'saida') {
      return NextResponse.json(
        {
          error: 'type must be either "entrada" or "saida"',
          code: 'INVALID_TYPE',
        },
        { status: 400 }
      );
    }

    if (!category || category.trim() === '') {
      return NextResponse.json(
        { error: 'category is required', code: 'MISSING_CATEGORY' },
        { status: 400 }
      );
    }

    if (amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'amount is required', code: 'MISSING_AMOUNT' },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'amount must be a positive number', code: 'INVALID_AMOUNT' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: 'date is required', code: 'MISSING_DATE' },
        { status: 400 }
      );
    }

    // Verify target congregation exists
    const targetCongregation = await db
      .select()
      .from(congregations)
      .where(eq(congregations.id, parseInt(congregationId)))
      .limit(1);

    if (targetCongregation.length === 0) {
      return NextResponse.json(
        { error: 'Congregation not found', code: 'CONGREGATION_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Check permission: admin_geral and admin_sede (headquarters) can create for any congregation
    // admin_congregacao can only create for their own
    const isAdminGeral = role === 'admin_geral';
    const isAdminSedeHeadquarters = role === 'admin_sede' && isHeadquarters;
    const canCreateForAny = isAdminGeral || isAdminSedeHeadquarters;

    if (!canCreateForAny && parseInt(congregationId) !== userCongregationId) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions to create transaction for this congregation',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Prepare insert data
    const now = new Date().toISOString();
    const insertData = {
      congregationId: parseInt(congregationId),
      type: type.trim(),
      category: category.trim(),
      amount: parsedAmount,
      date: date.trim(),
      description: description ? description.trim() : null,
      paymentMethod: paymentMethod ? paymentMethod.trim() : null,
      accountId: accountId ? accountId.trim() : null,
      titheGiverName: titheGiverName ? titheGiverName.trim() : null,
      createdBy: userId,
      status: 'ativo',
      createdAt: now,
      updatedAt: now,
    };

    const newTransaction = await db
      .insert(transactions)
      .values(insertData)
      .returning();

    if (newTransaction.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create transaction', code: 'CREATE_FAILED' },
        { status: 500 }
      );
    }

    // Get complete transaction with joins
    const completeTransaction = await db
      .select({
        id: transactions.id,
        congregationId: transactions.congregationId,
        type: transactions.type,
        category: transactions.category,
        amount: transactions.amount,
        date: transactions.date,
        description: transactions.description,
        paymentMethod: transactions.paymentMethod,
        accountId: transactions.accountId,
        titheGiverName: transactions.titheGiverName,
        createdBy: transactions.createdBy,
        status: transactions.status,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        congregation: {
          id: congregations.id,
          name: congregations.name,
          city: congregations.city,
          state: congregations.state,
          isHeadquarters: congregations.isHeadquarters,
        },
        creator: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        },
      })
      .from(transactions)
      .leftJoin(congregations, eq(transactions.congregationId, congregations.id))
      .leftJoin(users, eq(transactions.createdBy, users.id))
      .where(eq(transactions.id, newTransaction[0].id))
      .limit(1);

    return NextResponse.json(completeTransaction[0], { status: 201 });
  } catch (error) {
    console.error('POST transactions error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
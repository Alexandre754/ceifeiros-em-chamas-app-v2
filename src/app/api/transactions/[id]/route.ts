import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions, users, congregations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ipcecma-secret-key-2024';

interface JWTPayload {
  userId: number;
  role: string;
  congregationId: number;
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

function canAccessTransaction(user: JWTPayload, transactionCongregationId: number, isHeadquarters: boolean): boolean {
  if (user.role === 'admin_geral') {
    return true;
  }

  if (user.role === 'admin_sede' && isHeadquarters) {
    return true;
  }

  if (user.role === 'admin_congregacao' || user.role === 'membro') {
    return user.congregationId === transactionCongregationId;
  }

  return false;
}

function canModifyTransaction(user: JWTPayload, transactionCongregationId: number, isHeadquarters: boolean): boolean {
  if (user.role === 'membro') {
    return false;
  }

  if (user.role === 'admin_geral') {
    return true;
  }

  if (user.role === 'admin_sede' && isHeadquarters) {
    return true;
  }

  if (user.role === 'admin_congregacao') {
    return user.congregationId === transactionCongregationId;
  }

  return false;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const { id } = params;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const transactionId = parseInt(id);

    const result = await db
      .select({
        transaction: transactions,
        congregation: congregations,
        creator: users,
      })
      .from(transactions)
      .leftJoin(congregations, eq(transactions.congregationId, congregations.id))
      .leftJoin(users, eq(transactions.createdBy, users.id))
      .where(eq(transactions.id, transactionId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Transaction not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const { transaction, congregation, creator } = result[0];

    if (!congregation) {
      return NextResponse.json(
        { error: 'Transaction congregation not found', code: 'INVALID_DATA' },
        { status: 500 }
      );
    }

    const isHeadquarters = congregation.isHeadquarters || false;

    if (!canAccessTransaction(user, transaction.congregationId, isHeadquarters)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to access this transaction', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const response = {
      ...transaction,
      congregation: {
        id: congregation.id,
        name: congregation.name,
        city: congregation.city,
        state: congregation.state,
        isHeadquarters: congregation.isHeadquarters,
      },
      creator: creator
        ? {
            id: creator.id,
            name: creator.name,
            email: creator.email,
            role: creator.role,
          }
        : null,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('GET transaction error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const { id } = params;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const transactionId = parseInt(id);

    const existingResult = await db
      .select({
        transaction: transactions,
        congregation: congregations,
      })
      .from(transactions)
      .leftJoin(congregations, eq(transactions.congregationId, congregations.id))
      .where(eq(transactions.id, transactionId))
      .limit(1);

    if (existingResult.length === 0) {
      return NextResponse.json(
        { error: 'Transaction not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const { transaction, congregation } = existingResult[0];

    if (!congregation) {
      return NextResponse.json(
        { error: 'Transaction congregation not found', code: 'INVALID_DATA' },
        { status: 500 }
      );
    }

    const isHeadquarters = congregation.isHeadquarters || false;

    if (!canModifyTransaction(user, transaction.congregationId, isHeadquarters)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to modify this transaction', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const updates: Partial<typeof transactions.$inferInsert> = {};

    if (body.type !== undefined) {
      const trimmedType = body.type.trim();
      if (trimmedType !== 'entrada' && trimmedType !== 'saida') {
        return NextResponse.json(
          { error: 'Type must be "entrada" or "saida"', code: 'INVALID_TYPE' },
          { status: 400 }
        );
      }
      updates.type = trimmedType;
    }

    if (body.category !== undefined) {
      updates.category = body.category.trim();
    }

    if (body.amount !== undefined) {
      const amount = parseFloat(body.amount);
      if (isNaN(amount) || amount <= 0) {
        return NextResponse.json(
          { error: 'Amount must be a positive number', code: 'INVALID_AMOUNT' },
          { status: 400 }
        );
      }
      updates.amount = amount;
    }

    if (body.date !== undefined) {
      updates.date = body.date.trim();
    }

    if (body.description !== undefined) {
      updates.description = body.description.trim();
    }

    if (body.paymentMethod !== undefined) {
      updates.paymentMethod = body.paymentMethod.trim();
    }

    if (body.accountId !== undefined) {
      updates.accountId = body.accountId.trim();
    }

    if (body.titheGiverName !== undefined) {
      updates.titheGiverName = body.titheGiverName.trim();
    }

    if (body.status !== undefined) {
      updates.status = body.status.trim();
    }

    updates.updatedAt = new Date().toISOString();

    const updated = await db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.id, transactionId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update transaction', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    const updatedResult = await db
      .select({
        transaction: transactions,
        congregation: congregations,
        creator: users,
      })
      .from(transactions)
      .leftJoin(congregations, eq(transactions.congregationId, congregations.id))
      .leftJoin(users, eq(transactions.createdBy, users.id))
      .where(eq(transactions.id, transactionId))
      .limit(1);

    const { transaction: updatedTransaction, congregation: updatedCongregation, creator } = updatedResult[0];

    const response = {
      ...updatedTransaction,
      congregation: updatedCongregation
        ? {
            id: updatedCongregation.id,
            name: updatedCongregation.name,
            city: updatedCongregation.city,
            state: updatedCongregation.state,
            isHeadquarters: updatedCongregation.isHeadquarters,
          }
        : null,
      creator: creator
        ? {
            id: creator.id,
            name: creator.name,
            email: creator.email,
            role: creator.role,
          }
        : null,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('PUT transaction error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const { id } = params;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const transactionId = parseInt(id);

    const existingResult = await db
      .select({
        transaction: transactions,
        congregation: congregations,
      })
      .from(transactions)
      .leftJoin(congregations, eq(transactions.congregationId, congregations.id))
      .where(eq(transactions.id, transactionId))
      .limit(1);

    if (existingResult.length === 0) {
      return NextResponse.json(
        { error: 'Transaction not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const { transaction, congregation } = existingResult[0];

    if (!congregation) {
      return NextResponse.json(
        { error: 'Transaction congregation not found', code: 'INVALID_DATA' },
        { status: 500 }
      );
    }

    const isHeadquarters = congregation.isHeadquarters || false;

    if (!canModifyTransaction(user, transaction.congregationId, isHeadquarters)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this transaction', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    await db
      .update(transactions)
      .set({
        status: 'inativo',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(transactions.id, transactionId))
      .returning();

    return NextResponse.json(
      {
        message: 'Transaction deleted successfully',
        id: transactionId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE transaction error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
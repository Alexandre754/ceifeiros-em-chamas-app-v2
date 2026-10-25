import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { congregations, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ipcecma-secret-key-2024';

async function verifyToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.substring(7);
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (error) {
    return null;
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [user] = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
    if (!user || (user.role !== 'admin_geral' && user.role !== 'admin_sede')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const params = await context.params;
    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, city, state, address, isHeadquarters } = body;

    if (!name && !city && !state && address === undefined && isHeadquarters === undefined) {
      return NextResponse.json(
        { error: 'At least one field is required for update' },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(congregations)
      .where(eq(congregations.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Congregation not found' },
        { status: 404 }
      );
    }

    const updateData: {
      name?: string;
      city?: string;
      state?: string;
      address?: string;
      isHeadquarters?: boolean;
      updatedAt: string;
    } = {
      updatedAt: new Date().toISOString()
    };

    if (name !== undefined) {
      updateData.name = name.trim();
    }
    if (city !== undefined) {
      updateData.city = city.trim();
    }
    if (state !== undefined) {
      updateData.state = state.trim();
    }
    if (address !== undefined) {
      updateData.address = address ? address.trim() : address;
    }
    if (isHeadquarters !== undefined) {
      updateData.isHeadquarters = isHeadquarters;
    }

    const updated = await db
      .update(congregations)
      .set(updateData)
      .where(eq(congregations.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required' },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(congregations)
      .where(eq(congregations.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Congregation not found' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(congregations)
      .where(eq(congregations.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Congregation deleted successfully',
        id: deleted[0].id
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
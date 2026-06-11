import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { congregations, users } from '@/db/schema';
import { like, or, asc, eq } from 'drizzle-orm';
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

export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission
    const [user] = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let query = db.select().from(congregations);

    // Filter by congregation if not admin
    if (user.role === 'admin_congregacao' || user.role === 'membro') {
      if (!user.hasGeneralAccess) {
        if (user.congregationId) {
          query = query.where(eq(congregations.id, user.congregationId)) as any;
        } else {
          return NextResponse.json([], { status: 200 });
        }
      }
    }

    if (search) {
      const searchTerm = search.trim();
      query = query.where(
        or(
          like(congregations.name, `%${searchTerm}%`),
          like(congregations.city, `%${searchTerm}%`),
          like(congregations.state, `%${searchTerm}%`)
        )
      ) as any;
    }

    const results = await query.orderBy(asc(congregations.name));

    return NextResponse.json(results, { status: 200 });
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
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [user] = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
    if (!user || (user.role !== 'admin_geral' && user.role !== 'admin_sede')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, city, state, address, isHeadquarters } = body;

    if (!name || !city || !state) {
      return NextResponse.json(
        { error: 'Name, city and state are required', code: 'MISSING_REQUIRED_FIELDS' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const trimmedCity = city.trim();
    const trimmedState = state.trim();
    const trimmedAddress = address ? address.trim() : null;

    if (!trimmedName || !trimmedCity || !trimmedState) {
      return NextResponse.json(
        { error: 'Name, city and state are required', code: 'MISSING_REQUIRED_FIELDS' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const newCongregation = await db
      .insert(congregations)
      .values({
        name: trimmedName,
        city: trimmedCity,
        state: trimmedState,
        address: trimmedAddress,
        isHeadquarters: isHeadquarters ?? false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newCongregation[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
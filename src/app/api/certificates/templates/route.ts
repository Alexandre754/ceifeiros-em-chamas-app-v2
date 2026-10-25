import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { certificateTemplates, users } from '@/db/schema';
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

// GET: Listar todos os modelos
export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const templates = await db.select().from(certificateTemplates);

    return NextResponse.json(templates, { status: 200 });
  } catch (error) {
    console.error('GET templates error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// POST: Criar novo modelo
export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Apenas admin_geral e admin_sede podem criar modelos
    if (user.role !== 'admin_geral' && user.role !== 'admin_sede') {
      return NextResponse.json(
        { error: 'Only administrators can create templates', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, content, fields, backgroundImage, frameImage } = body;

    if (!name || !content || !fields) {
      return NextResponse.json(
        { error: 'Name, content, and fields are required', code: 'MISSING_REQUIRED_FIELDS' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const newTemplate = await db
      .insert(certificateTemplates)
      .values({
        name: name.trim(),
        description: description?.trim() || null,
        content,
        fields: typeof fields === 'string' ? fields : JSON.stringify(fields),
        backgroundImage: backgroundImage || null,
        frameImage: frameImage || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newTemplate[0], { status: 201 });
  } catch (error) {
    console.error('POST template error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
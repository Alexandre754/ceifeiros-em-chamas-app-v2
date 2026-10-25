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

// GET: Buscar modelo por ID
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
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid template ID', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const template = await db
      .select()
      .from(certificateTemplates)
      .where(eq(certificateTemplates.id, id))
      .limit(1);

    if (template.length === 0) {
      return NextResponse.json(
        { error: 'Template not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(template[0], { status: 200 });
  } catch (error) {
    console.error('GET template error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT: Atualizar modelo
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    if (user.role !== 'admin_geral' && user.role !== 'admin_sede') {
      return NextResponse.json(
        { error: 'Only administrators can update templates', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid template ID', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(certificateTemplates)
      .where(eq(certificateTemplates.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Template not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();

    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.fields !== undefined) updateData.fields = typeof body.fields === 'string' ? body.fields : JSON.stringify(body.fields);
    if (body.backgroundImage !== undefined) updateData.backgroundImage = body.backgroundImage;
    if (body.frameImage !== undefined) updateData.frameImage = body.frameImage;

    const updated = await db
      .update(certificateTemplates)
      .set(updateData)
      .where(eq(certificateTemplates.id, id))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT template error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE: Excluir modelo
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    if (user.role !== 'admin_geral' && user.role !== 'admin_sede') {
      return NextResponse.json(
        { error: 'Only administrators can delete templates', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid template ID', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(certificateTemplates)
      .where(eq(certificateTemplates.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Template not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    await db.delete(certificateTemplates).where(eq(certificateTemplates.id, id));

    return NextResponse.json({ message: 'Template deleted successfully', id }, { status: 200 });
  } catch (error) {
    console.error('DELETE template error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
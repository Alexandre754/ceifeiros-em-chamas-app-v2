import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { memberPermissions, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const userId = parseInt(params.id);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'ID de usuário inválido' }, { status: 400 });
    }

    const permissions = await db
      .select()
      .from(memberPermissions)
      .where(eq(memberPermissions.userId, userId));

    return NextResponse.json(permissions, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const userId = parseInt(params.id);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'ID de usuário inválido' }, { status: 400 });
    }

    const body = await request.json();
    const { permissions } = body;

    if (!Array.isArray(permissions)) {
      return NextResponse.json({ error: 'Permissões devem ser um array' }, { status: 400 });
    }

    // Delete existing permissions for this user
    await db.delete(memberPermissions).where(eq(memberPermissions.userId, userId));

    // Insert new permissions
    if (permissions.length > 0) {
      const now = new Date().toISOString();
      const permissionsToInsert = permissions.map((key: string) => ({
        userId,
        permissionKey: key,
        granted: true,
        createdAt: now,
        updatedAt: now,
      }));

      await db.insert(memberPermissions).values(permissionsToInsert);
    }

    return NextResponse.json({ message: 'Permissões atualizadas com sucesso' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

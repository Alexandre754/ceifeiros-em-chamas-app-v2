import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, members } from '@/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    // Decode JWT token
    const secret = process.env.JWT_SECRET || 'ipcecma-secret-key-2024';
    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Verify user from token
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuário não autorizado' },
        { status: 401 }
      );
    }

    const memberId = parseInt(params.id);

    // Get member
    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1);

    if (!member) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      );
    }

    // Find user account for this member (by email match)
    if (!member.email) {
      return NextResponse.json(
        { hasAccess: false, user: null },
        { status: 200 }
      );
    }

    const [userAccount] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        approved: users.approved,
        hasGeneralAccess: users.hasGeneralAccess,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.email, member.email))
      .limit(1);

    if (!userAccount) {
      return NextResponse.json(
        { hasAccess: false, user: null },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { hasAccess: true, user: userAccount },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error fetching member access:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar acesso: ' + error.message },
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
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    // Decode JWT token
    const secret = process.env.JWT_SECRET || 'ipcecma-secret-key-2024';
    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Verify user from token
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuário não autorizado' },
        { status: 401 }
      );
    }

    // Check if user has permission
    if (!['admin_geral', 'admin_sede', 'admin_congregacao'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Sem permissão para remover acesso' },
        { status: 403 }
      );
    }

    const memberId = parseInt(params.id);

    // Get member
    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1);

    if (!member) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      );
    }

    // Find user account by email
    if (member.email) {
      const [userToDelete] = await db
        .select()
        .from(users)
        .where(eq(users.email, member.email))
        .limit(1);

      if (userToDelete) {
        // IMPORTANT: Instead of deleting, we'll set the user as inactive
        // This prevents foreign key constraint errors with communityPosts and other relations
        await db
          .update(users)
          .set({
            approved: false,
            updatedAt: new Date().toISOString()
          })
          .where(eq(users.id, userToDelete.id));
      }
    }

    return NextResponse.json(
      { message: 'Acesso removido com sucesso' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error deleting member access:', error);
    return NextResponse.json(
      { error: 'Erro ao remover acesso: ' + error.message },
      { status: 500 }
    );
  }
}
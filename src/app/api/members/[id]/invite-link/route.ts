import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, members } from '@/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

export async function POST(
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
        { error: 'Sem permissão para gerar link de convite' },
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

    // Check if member has email
    if (!member.email) {
      return NextResponse.json(
        { error: 'Membro não possui email cadastrado' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, member.email))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: 'Membro já possui acesso ao sistema' },
        { status: 400 }
      );
    }

    // Generate invite token (valid for 7 days)
    const inviteToken = jwt.sign(
      {
        memberId: member.id,
        email: member.email,
        name: member.name,
        congregationId: member.congregationId,
        type: 'invite'
      },
      secret,
      { expiresIn: '7d' }
    );

    // Generate invite link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/register?invite=${inviteToken}`;

    return NextResponse.json({
      inviteLink,
      expiresIn: '7 dias'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error generating invite link:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar link de convite: ' + error.message },
      { status: 500 }
    );
  }
}

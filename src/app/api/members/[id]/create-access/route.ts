import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, members } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
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
        { error: 'Sem permissão para criar acesso' },
        { status: 403 }
      );
    }

    const memberId = parseInt(params.id);
    const body = await request.json();
    const { email, password, role = 'membro' } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      );
    }

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

    // Check if email already exists
    const normalizedEmail = email.trim().toLowerCase();
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já cadastrado no sistema' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user account for member
    const userData: any = {
      name: member.name,
      email: normalizedEmail,
      password: hashedPassword,
      phone: member.phone,
      role: role,
      congregationId: member.congregationId,
      approved: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const [createdUser] = await db
      .insert(users)
      .values(userData)
      .returning();

    // Remove password from response
    const { password: _, ...userWithoutPassword } = createdUser;

    return NextResponse.json({
      message: 'Acesso criado com sucesso',
      user: userWithoutPassword
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating member access:', error);
    return NextResponse.json(
      { error: 'Erro ao criar acesso: ' + error.message },
      { status: 500 }
    );
  }
}
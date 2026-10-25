import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, congregations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { 
          error: 'Email e senha são obrigatórios',
          code: 'MISSING_REQUIRED_FIELDS'
        },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Query user by email
    console.log('🔍 Buscando usuário:', normalizedEmail);
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (userResult.length === 0) {
      console.log('❌ Usuário não encontrado:', normalizedEmail);
      return NextResponse.json(
        { 
          error: 'Email ou senha inválidos',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      );
    }

    const user = userResult[0];

    // Verify password
    console.log('🔑 Verificando senha para:', normalizedEmail);
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      console.log('❌ Senha inválida para:', normalizedEmail);
      return NextResponse.json(
        { 
          error: 'Email ou senha inválidos',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      );
    }

    // Check if user is approved
    if (!user.approved) {
      console.log('⚠️ Usuário não aprovado:', normalizedEmail);
      return NextResponse.json(
        { 
          error: 'Sua conta ainda não foi aprovada. Aguarde a aprovação de um administrador.',
          code: 'USER_NOT_APPROVED'
        },
        { status: 403 }
      );
    }

    // Fetch congregation data if user has congregationId
    let congregation = null;
    if (user.congregationId) {
      console.log('⛪ Buscando congregação:', user.congregationId);
      const congregationResult = await db
        .select()
        .from(congregations)
        .where(eq(congregations.id, user.congregationId))
        .limit(1);

      if (congregationResult.length > 0) {
        congregation = congregationResult[0];
      }
    }

    // Generate JWT token
    console.log('🎟️ Gerando token JWT...');
    const secret = process.env.JWT_SECRET || 'ipcecma-secret-key-2024';
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      congregationId: user.congregationId
    };
    const token = jwt.sign(payload, secret, { expiresIn: '7d' });

    // Remove password and originalPassword from user object
    const { password: _, originalPassword: __, ...userWithoutPassword } = user;

    // Construct response
    const response = {
      user: {
        ...userWithoutPassword,
        hasGeneralAccess: user.hasGeneralAccess || false,
        congregation: congregation || null
      },
      token
    };

    console.log('✅ Login concluído com sucesso para:', normalizedEmail);
    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}
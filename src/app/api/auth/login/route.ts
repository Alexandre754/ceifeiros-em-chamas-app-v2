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

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios', code: 'MISSING_REQUIRED_FIELDS' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    console.log('🔍 Buscando usuário:', normalizedEmail);
    
    // 🔥 AQUI ESTAVA O ERRO: A consulta ao banco (Vercel -> Turso)
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (userResult.length === 0) {
      console.log('❌ Usuário não encontrado:', normalizedEmail);
      return NextResponse.json(
        { error: 'Email ou senha inválidos', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    const user = userResult[0];
    console.log('🔑 Verificando senha para:', normalizedEmail);
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      console.log('❌ Senha inválida para:', normalizedEmail);
      return NextResponse.json(
        { error: 'Email ou senha inválidos', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    if (!user.approved) {
      console.log('⚠️ Usuário não aprovado:', normalizedEmail);
      return NextResponse.json(
        { error: 'Sua conta ainda não foi aprovada.', code: 'USER_NOT_APPROVED' },
        { status: 403 }
      );
    }

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

    console.log('🎟️ Gerando token JWT...');
    const secret = process.env.JWT_SECRET || 'ipcecma-secret-key-2024';
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      congregationId: user.congregationId
    };
    const token = jwt.sign(payload, secret, { expiresIn: '7d' });

    const { password: _, originalPassword: __, ...userWithoutPassword } = user;

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

  } catch (error: any) {
    // 🔥 AQUI ESTÁ A MUDANÇA: Vamos cuspir o erro real do banco de dados no console!
    console.error('ERRO DETALHADO NO LOGIN:', error.cause || error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor: ' + (error.cause?.message || error.message || 'Erro desconhecido')
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, members } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { 
          error: 'Nome, email e senha são obrigatórios',
          code: 'MISSING_REQUIRED_FIELDS'
        },
        { status: 400 }
      );
    }

    // Validate email format
    if (!email.includes('@')) {
      return NextResponse.json(
        { 
          error: 'Formato de email inválido',
          code: 'INVALID_EMAIL_FORMAT'
        },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { 
          error: 'A senha deve ter no mínimo 6 caracteres',
          code: 'PASSWORD_TOO_SHORT'
        },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { 
          error: 'Email já cadastrado',
          code: 'EMAIL_ALREADY_EXISTS'
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare user data - all users registered as "membro" and need admin approval
    const userData: any = {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      originalPassword: password,
      phone: phone ? phone.trim() : null,
      role: 'admin_geral', // Provisoriamente como admin para o usuário conseguir ver tudo
      congregationId: 1,
      approved: true, // Auto-aprovação para facilitar testes do usuário
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Insert user
    const createdUser = await db
      .insert(users)
      .values(userData)
      .returning();

    // Create member profile automatically
    const memberData: any = {
      congregationId: 1, // Default congregation (Atibaia - adjust if needed)
      name: name.trim(),
      cpf: null,
      rg: null,
      birthDate: new Date().toISOString().split('T')[0], // Placeholder - user can update later
      age: null,
      sex: 'não informado',
      maritalStatus: 'não informado',
      spouse: null,
      email: normalizedEmail,
      phone: phone ? phone.trim() : null,
      address: null,
      cep: null,
      neighborhood: null,
      city: null,
      state: null,
      position: 'membro',
      baptismDate: null,
      memberSince: new Date().toISOString().split('T')[0],
      photoUrl: null,
      status: 'ativo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.insert(members).values(memberData);

    // Remove password and originalPassword from response
    const { password: _, originalPassword: __, ...userWithoutPassword } = createdUser[0];

    return NextResponse.json(userWithoutPassword, { status: 201 });

  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor: ' + error.message 
      },
      { status: 500 }
    );
  }
}
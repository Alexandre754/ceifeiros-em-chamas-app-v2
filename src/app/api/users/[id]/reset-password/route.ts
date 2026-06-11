import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'ipcecma-secret-key-2024'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Verificar se o usuário logado tem permissão para resetar senhas
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1)

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar permissões - apenas admins podem resetar senhas de outros usuários
    if (!['admin_geral', 'admin_sede', 'admin_congregacao'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Sem permissão para resetar senhas' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { newPassword } = body

    if (!newPassword) {
      return NextResponse.json(
        { error: 'Nova senha é obrigatória' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'A nova senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      )
    }

    const userId = parseInt(params.id)

    // Buscar usuário alvo
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Atualizar senha
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date().toISOString()
      })
      .where(eq(users.id, userId))

    return NextResponse.json({ 
      message: 'Senha alterada com sucesso',
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email
      }
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: 'Erro ao resetar senha' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { members, users, congregations } from '@/db/schema';
import { eq, like, or } from 'drizzle-orm';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ipcecma-secret-key-2024';

interface JWTPayload {
  userId: number;
  role: string;
  congregationId: number;
}

async function verifyToken(request: NextRequest): Promise<{ user: any } | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    const userResult = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        congregationId: users.congregationId,
      })
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (userResult.length === 0) {
      return null;
    }

    return { user: userResult[0] };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = authResult;

    // Try to find member by email (case-insensitive)
    let member = null;
    
    if (user.email) {
      const normalizedEmail = user.email.trim().toLowerCase();
      
      const memberByEmail = await db
        .select({
          id: members.id,
          congregationId: members.congregationId,
          name: members.name,
          cpf: members.cpf,
          rg: members.rg,
          birthDate: members.birthDate,
          age: members.age,
          sex: members.sex,
          maritalStatus: members.maritalStatus,
          spouse: members.spouse,
          email: members.email,
          phone: members.phone,
          address: members.address,
          cep: members.cep,
          neighborhood: members.neighborhood,
          city: members.city,
          state: members.state,
          position: members.position,
          baptismDate: members.baptismDate,
          memberSince: members.memberSince,
          photoUrl: members.photoUrl,
          status: members.status,
          createdAt: members.createdAt,
          updatedAt: members.updatedAt,
          congregation: {
            id: congregations.id,
            name: congregations.name,
            city: congregations.city,
            state: congregations.state,
          },
        })
        .from(members)
        .leftJoin(congregations, eq(members.congregationId, congregations.id))
        .where(eq(members.email, normalizedEmail))
        .limit(1);

      if (memberByEmail.length > 0) {
        member = memberByEmail[0];
      }
    }

    // If not found by email, try to find by name (exact match)
    if (!member && user.name) {
      const memberByName = await db
        .select({
          id: members.id,
          congregationId: members.congregationId,
          name: members.name,
          cpf: members.cpf,
          rg: members.rg,
          birthDate: members.birthDate,
          age: members.age,
          sex: members.sex,
          maritalStatus: members.maritalStatus,
          spouse: members.spouse,
          email: members.email,
          phone: members.phone,
          address: members.address,
          cep: members.cep,
          neighborhood: members.neighborhood,
          city: members.city,
          state: members.state,
          position: members.position,
          baptismDate: members.baptismDate,
          memberSince: members.memberSince,
          photoUrl: members.photoUrl,
          status: members.status,
          createdAt: members.createdAt,
          updatedAt: members.updatedAt,
          congregation: {
            id: congregations.id,
            name: congregations.name,
            city: congregations.city,
            state: congregations.state,
          },
        })
        .from(members)
        .leftJoin(congregations, eq(members.congregationId, congregations.id))
        .where(eq(members.name, user.name))
        .limit(1);

      if (memberByName.length > 0) {
        member = memberByName[0];
      }
    }

    // If still not found and user has congregationId, try to find by name within congregation
    if (!member && user.name && user.congregationId) {
      const memberByNameAndCongregation = await db
        .select({
          id: members.id,
          congregationId: members.congregationId,
          name: members.name,
          cpf: members.cpf,
          rg: members.rg,
          birthDate: members.birthDate,
          age: members.age,
          sex: members.sex,
          maritalStatus: members.maritalStatus,
          spouse: members.spouse,
          email: members.email,
          phone: members.phone,
          address: members.address,
          cep: members.cep,
          neighborhood: members.neighborhood,
          city: members.city,
          state: members.state,
          position: members.position,
          baptismDate: members.baptismDate,
          memberSince: members.memberSince,
          photoUrl: members.photoUrl,
          status: members.status,
          createdAt: members.createdAt,
          updatedAt: members.updatedAt,
          congregation: {
            id: congregations.id,
            name: congregations.name,
            city: congregations.city,
            state: congregations.state,
          },
        })
        .from(members)
        .leftJoin(congregations, eq(members.congregationId, congregations.id))
        .where(
          or(
            eq(members.name, user.name),
            like(members.name, `%${user.name}%`)
          )
        )
        .limit(1);

      if (memberByNameAndCongregation.length > 0) {
        member = memberByNameAndCongregation[0];
      }
    }

    if (!member) {
      return NextResponse.json(
        { error: 'Member profile not found', user: { name: user.name, email: user.email } },
        { status: 404 }
      );
    }

    return NextResponse.json({ member });
  } catch (error) {
    console.error('GET /api/members/me error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

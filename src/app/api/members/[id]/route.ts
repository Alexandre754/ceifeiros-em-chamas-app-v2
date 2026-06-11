import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { members, users, congregations } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ipcecma-secret-key-2024';

interface JWTPayload {
  userId: number;
  role: string;
  congregationId?: number;
}

async function verifyToken(request: NextRequest): Promise<JWTPayload | null> {
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

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

async function checkPermission(
  userId: number,
  memberId: number,
  method: 'GET' | 'PUT' | 'DELETE'
): Promise<{ allowed: boolean; user?: any; member?: any }> {
  try {
    const [user] = await db
      .select({
        id: users.id,
        role: users.role,
        congregationId: users.congregationId,
        isHeadquarters: congregations.isHeadquarters,
      })
      .from(users)
      .leftJoin(congregations, eq(users.congregationId, congregations.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return { allowed: false };
    }

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1);

    if (!member) {
      return { allowed: false, user };
    }

    if (user.role === 'admin_geral') {
      return { allowed: true, user, member };
    }

    if (user.role === 'admin_sede' && user.isHeadquarters === true) {
      return { allowed: true, user, member };
    }

    if (user.role === 'admin_congregacao') {
      if (member.congregationId === user.congregationId) {
        return { allowed: true, user, member };
      }
      return { allowed: false, user, member };
    }

    if (user.role === 'membro') {
      if (method === 'GET' && member.congregationId === user.congregationId) {
        return { allowed: true, user, member };
      }
      return { allowed: false, user, member };
    }

    return { allowed: false, user, member };
  } catch (error) {
    console.error('Permission check error:', error);
    return { allowed: false };
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tokenPayload = await verifyToken(request);
    if (!tokenPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required' },
        { status: 400 }
      );
    }

    const memberId = parseInt(id);

    const permissionCheck = await checkPermission(
      tokenPayload.userId,
      memberId,
      'GET'
    );

    if (!permissionCheck.member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: "Forbidden - You don't have permission to access this member" },
        { status: 403 }
      );
    }

    const [memberWithCongregation] = await db
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
        memberLevelId: members.memberLevelId,
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
          address: congregations.address,
          isHeadquarters: congregations.isHeadquarters,
        },
      })
      .from(members)
      .leftJoin(congregations, eq(members.congregationId, congregations.id))
      .where(eq(members.id, memberId))
      .limit(1);

    return NextResponse.json(memberWithCongregation);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tokenPayload = await verifyToken(request);
    if (!tokenPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required' },
        { status: 400 }
      );
    }

    const memberId = parseInt(id);

    const permissionCheck = await checkPermission(
      tokenPayload.userId,
      memberId,
      'PUT'
    );

    if (!permissionCheck.member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: "Forbidden - You don't have permission to access this member" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      congregationId,
      name,
      cpf,
      rg,
      birthDate,
      sex,
      maritalStatus,
      spouse,
      email,
      phone,
      address,
      cep,
      neighborhood,
      city,
      state,
      position,
      memberLevelId,
      baptismDate,
      memberSince,
      photoUrl,
      status,
    } = body;

    if (sex && sex !== 'masculino' && sex !== 'feminino') {
      return NextResponse.json(
        { error: "Sex must be 'masculino' or 'feminino'" },
        { status: 400 }
      );
    }

    if (cpf) {
      const trimmedCpf = cpf.trim();
      const existingMember = await db
        .select()
        .from(members)
        .where(and(eq(members.cpf, trimmedCpf), ne(members.id, memberId)))
        .limit(1);

      if (existingMember.length > 0) {
        return NextResponse.json(
          { error: 'CPF already registered by another member' },
          { status: 400 }
        );
      }
    }

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (congregationId !== undefined) updates.congregationId = congregationId;
    if (name !== undefined && name !== null) updates.name = name.trim();
    if (cpf !== undefined && cpf !== null) updates.cpf = cpf.trim();
    if (rg !== undefined && rg !== null) updates.rg = rg.trim();
    if (birthDate !== undefined) {
      updates.birthDate = birthDate;
      updates.age = calculateAge(birthDate);
    }
    if (sex !== undefined) updates.sex = sex;
    if (maritalStatus !== undefined) {
      updates.maritalStatus = maritalStatus ? maritalStatus.trim() : null;
    }
    if (spouse !== undefined) {
      updates.spouse = spouse ? spouse.trim() : null;
    }
    if (email !== undefined && email !== null) updates.email = email.trim().toLowerCase();
    if (phone !== undefined && phone !== null) updates.phone = phone.trim();
    if (address !== undefined && address !== null) updates.address = address.trim();
    if (cep !== undefined && cep !== null) updates.cep = cep.trim();
    if (neighborhood !== undefined && neighborhood !== null) updates.neighborhood = neighborhood.trim();
    if (city !== undefined && city !== null) updates.city = city.trim();
    if (state !== undefined && state !== null) updates.state = state.trim();
    if (position !== undefined && position !== null) updates.position = position.trim();
    if (memberLevelId !== undefined) updates.memberLevelId = memberLevelId ? parseInt(memberLevelId) : null;
    if (baptismDate !== undefined) updates.baptismDate = baptismDate;
    if (memberSince !== undefined) updates.memberSince = memberSince;
    if (photoUrl !== undefined && photoUrl !== null) updates.photoUrl = photoUrl.trim();
    if (status !== undefined) updates.status = status;

    const [updatedMember] = await db
      .update(members)
      .set(updates)
      .where(eq(members.id, memberId))
      .returning();

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tokenPayload = await verifyToken(request);
    if (!tokenPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required' },
        { status: 400 }
      );
    }

    const memberId = parseInt(id);

    const permissionCheck = await checkPermission(
      tokenPayload.userId,
      memberId,
      'DELETE'
    );

    if (!permissionCheck.member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: "Forbidden - You don't have permission to access this member" },
        { status: 403 }
      );
    }

    await db
      .update(members)
      .set({
        status: 'inativo',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(members.id, memberId));

    return NextResponse.json({
      message: 'Member deactivated successfully',
      id: memberId,
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { members, users, congregations } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ipcecma-secret-key-2024';

interface JWTPayload {
  userId: number;
  role: string;
  congregationId: number;
}

async function verifyToken(request: NextRequest): Promise<{ user: any; congregation: any } | null> {
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
    
    // Query user with congregation data
    const userResult = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        congregationId: users.congregationId,
        hasGeneralAccess: users.hasGeneralAccess,
        congregation: {
          id: congregations.id,
          name: congregations.name,
          isHeadquarters: congregations.isHeadquarters,
        },
      })
      .from(users)
      .leftJoin(congregations, eq(users.congregationId, congregations.id))
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (userResult.length === 0) {
      return null;
    }

    return {
      user: {
        id: userResult[0].id,
        name: userResult[0].name,
        email: userResult[0].email,
        role: userResult[0].role,
        congregationId: userResult[0].congregationId,
        hasGeneralAccess: userResult[0].hasGeneralAccess || false,
      },
      congregation: userResult[0].congregation,
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user, congregation } = authResult;
    const { searchParams } = new URL(request.url);

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const congregationIdParam = searchParams.get('congregationId');
    const emailParam = searchParams.get('email');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Build base query with congregation join
    let query = db
      .select({
        id: members.id,
        congregationId: members.congregationId,
        congregationName: congregations.name,
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
      .leftJoin(congregations, eq(members.congregationId, congregations.id));

    // Apply permission-based filtering
    const conditions = [];

    // CRITICAL: Filter out inactive members by default
    if (!includeInactive) {
      conditions.push(eq(members.status, 'ativo'));
    }

    if (user.role === 'admin_geral' || user.hasGeneralAccess) {
      // admin_geral or user with hasGeneralAccess can see all members - no additional filter needed
    } else if (user.role === 'admin_sede' && congregation?.isHeadquarters === true) {
      // admin_sede from headquarters can see all members - no additional filter needed
    } else if (user.role === 'admin_congregacao' || user.role === 'membro') {
      // Can only see members from their congregation
      if (user.congregationId) {
        conditions.push(eq(members.congregationId, user.congregationId));
      } else {
        // If user has no congregation, return empty array
        return NextResponse.json({
          members: [],
          total: 0,
          userRole: user.role,
          userCongregationId: user.congregationId
        });
      }
    } else {
      // Unknown role - restrict to user's congregation if available
      if (user.congregationId) {
        conditions.push(eq(members.congregationId, user.congregationId));
      } else {
        return NextResponse.json({
          members: [],
          total: 0,
          userRole: user.role,
          userCongregationId: user.congregationId
        });
      }
    }

    // Apply email filter (exact match for profile lookup)
    if (emailParam) {
      const normalizedEmail = emailParam.trim().toLowerCase();
      conditions.push(eq(members.email, normalizedEmail));
    }

    // Apply additional congregationId filter if provided (respecting permissions)
    if (congregationIdParam) {
      const requestedCongregationId = parseInt(congregationIdParam);
      
      // Check if user has permission to view this congregation
      if (user.role === 'admin_geral' || 
          (user.role === 'admin_sede' && congregation?.isHeadquarters === true)) {
        conditions.push(eq(members.congregationId, requestedCongregationId));
      } else if ((user.role === 'admin_congregacao' || user.role === 'membro') && 
                 user.congregationId === requestedCongregationId) {
        conditions.push(eq(members.congregationId, requestedCongregationId));
      } else {
        // User doesn't have permission to view this congregation
        return NextResponse.json({
          members: [],
          total: 0,
          userRole: user.role,
          userCongregationId: user.congregationId
        });
      }
    }

    // Apply search filter (general search, not for exact email match)
    if (search && !emailParam) {
      const searchTerm = `%${search}%`;
      const searchCondition = or(
        like(members.name, searchTerm),
        like(members.cpf, searchTerm),
        like(members.email, searchTerm),
        like(members.phone, searchTerm)
      );
      conditions.push(searchCondition);
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Apply pagination and ordering
    const results = await query
      .orderBy(desc(members.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for the same conditions
    let countQuery = db
      .select({ count: members.id })
      .from(members)
      .leftJoin(congregations, eq(members.congregationId, congregations.id));

    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions)) as any;
    }

    const countResult = await countQuery;
    const total = countResult.length;

    return NextResponse.json({
      members: results,
      total,
      userRole: user.role,
      userCongregationId: user.congregationId
    });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Você precisa estar autenticado para adicionar membros' }, { status: 401 });
    }

    const { user, congregation } = authResult;
    const body = await request.json();

    // Validate required fields
    const { congregationId, name, birthDate, sex, phone, position } = body;

    if (!congregationId || !name || !birthDate || !sex || !phone || !position) {
      return NextResponse.json(
        { 
          error: 'congregationId, name, birthDate, sex, phone and position are required',
          code: 'MISSING_REQUIRED_FIELDS'
        },
        { status: 400 }
      );
    }

    // Check if user has permission to add member to this congregation
    const requestedCongregationId = parseInt(congregationId);
    if (user.role === 'admin_geral' || 
        (user.role === 'admin_sede' && congregation?.isHeadquarters === true)) {
      // Can add to any congregation
    } else if ((user.role === 'admin_congregacao' || user.role === 'membro') && 
               user.congregationId === requestedCongregationId) {
      // Can only add to their own congregation
    } else {
      return NextResponse.json(
        { error: 'Você não tem permissão para adicionar membros a esta congregação' },
        { status: 403 }
      );
    }

    // Validate sex
    if (sex !== 'masculino' && sex !== 'feminino') {
      return NextResponse.json(
        { 
          error: "Sex must be 'masculino' or 'feminino'",
          code: 'INVALID_SEX'
        },
        { status: 400 }
      );
    }

    // Check for duplicate CPF if provided
    if (body.cpf) {
      const cpfTrimmed = body.cpf.trim();
      const existingMember = await db
        .select()
        .from(members)
        .where(eq(members.cpf, cpfTrimmed))
        .limit(1);

      if (existingMember.length > 0) {
        return NextResponse.json(
          { 
            error: 'CPF already registered',
            code: 'DUPLICATE_CPF'
          },
          { status: 400 }
        );
      }
    }

    // Calculate age from birthDate if not provided
    let age = body.age;
    if (!age && birthDate) {
      const birthDateObj = new Date(birthDate);
      age = Math.floor((Date.now() - birthDateObj.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    }

    // Prepare insert data with sanitized inputs
    const insertData = {
      congregationId: parseInt(congregationId),
      name: name.trim(),
      cpf: body.cpf ? body.cpf.trim() : null,
      rg: body.rg ? body.rg.trim() : null,
      birthDate: birthDate.trim(),
      age: age || null,
      sex: sex.trim(),
      maritalStatus: body.maritalStatus ? body.maritalStatus.trim() : null,
      spouse: body.spouse ? body.spouse.trim() : null,
      email: body.email ? body.email.trim().toLowerCase() : null,
      phone: phone.trim(),
      address: body.address ? body.address.trim() : null,
      cep: body.cep ? body.cep.trim() : null,
      neighborhood: body.neighborhood ? body.neighborhood.trim() : null,
      city: body.city ? body.city.trim() : null,
      state: body.state ? body.state.trim() : null,
      position: position.trim(),
      memberLevelId: body.memberLevelId ? parseInt(body.memberLevelId) : null,
      baptismDate: body.baptismDate ? body.baptismDate.trim() : null,
      memberSince: body.memberSince ? body.memberSince.trim() : null,
      photoUrl: body.photoUrl ? body.photoUrl.trim() : null,
      status: body.status || 'ativo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Insert into database
    const newMember = await db
      .insert(members)
      .values(insertData)
      .returning();

    return NextResponse.json(newMember[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
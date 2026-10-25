import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userApprovals, users, congregations } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: number;
  role: string;
  congregationId?: number;
}

async function verifyAdminToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'ipcecma-secret-key-2024';
    
    const decoded = jwt.verify(token, secret) as JWTPayload;
    
    if (decoded.role === 'admin_geral') {
      return decoded;
    }
    
    if (decoded.role === 'admin_sede' && decoded.congregationId) {
      const userCongregation = await db.select()
        .from(congregations)
        .where(eq(congregations.id, decoded.congregationId))
        .limit(1);
      
      if (userCongregation.length > 0 && userCongregation[0].isHeadquarters) {
        return decoded;
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await verifyAdminToken(request);
    
    if (!adminUser) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader) {
        return NextResponse.json({ 
          error: 'Authentication required',
          code: 'UNAUTHORIZED' 
        }, { status: 401 });
      }
      
      return NextResponse.json({ 
        error: 'Insufficient permissions. Only admin_geral or admin_sede from headquarters can access this endpoint',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'pendente';

    const approvalRequests = await db.select({
      id: userApprovals.id,
      userId: userApprovals.userId,
      status: userApprovals.status,
      requestedAt: userApprovals.requestedAt,
      approvedBy: userApprovals.approvedBy,
      approvedAt: userApprovals.approvedAt,
      rejectionReason: userApprovals.rejectionReason,
      userName: users.name,
      userEmail: users.email,
      userRole: users.role,
      userCongregationId: users.congregationId,
      congregationId: congregations.id,
      congregationName: congregations.name,
      congregationCity: congregations.city,
      congregationState: congregations.state,
    })
      .from(userApprovals)
      .innerJoin(users, eq(userApprovals.userId, users.id))
      .leftJoin(congregations, eq(users.congregationId, congregations.id))
      .where(eq(userApprovals.status, statusFilter))
      .orderBy(desc(userApprovals.requestedAt));

    const formattedResults = approvalRequests.map(request => ({
      id: request.id,
      userId: request.userId,
      status: request.status,
      requestedAt: request.requestedAt,
      approvedBy: request.approvedBy,
      approvedAt: request.approvedAt,
      rejectionReason: request.rejectionReason,
      user: {
        id: request.userId,
        name: request.userName,
        email: request.userEmail,
        role: request.userRole,
        congregationId: request.userCongregationId,
        congregation: request.congregationId ? {
          id: request.congregationId,
          name: request.congregationName,
          city: request.congregationCity,
          state: request.congregationState,
        } : null,
      },
    }));

    return NextResponse.json(formattedResults, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}
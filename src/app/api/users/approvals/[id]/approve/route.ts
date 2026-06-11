import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userApprovals, users, congregations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: number;
  role: string;
  congregationId?: number;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication: Extract and verify JWT token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'MISSING_TOKEN' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded: JWTPayload;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'ipcecma-secret-key-2024'
      ) as JWTPayload;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    // Validate ID parameter
    const params = await context.params;
    const approvalId = params.id;
    if (!approvalId || isNaN(parseInt(approvalId))) {
      return NextResponse.json(
        { error: 'Valid approval ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Permission System: Verify user is admin_geral or admin_sede from headquarters
    const adminUserId = decoded.userId;
    const adminRole = decoded.role;

    if (adminRole === 'admin_geral') {
      // admin_geral can approve any user
    } else if (adminRole === 'admin_sede') {
      // admin_sede must be from headquarters
      if (!decoded.congregationId) {
        return NextResponse.json(
          { error: 'Forbidden: Admin congregation not found', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      const adminCongregation = await db
        .select()
        .from(congregations)
        .where(eq(congregations.id, decoded.congregationId))
        .limit(1);

      if (adminCongregation.length === 0 || !adminCongregation[0].isHeadquarters) {
        return NextResponse.json(
          {
            error: 'Forbidden: Only headquarters administrators can approve users',
            code: 'FORBIDDEN',
          },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Query user_approvals by id
    const approval = await db
      .select()
      .from(userApprovals)
      .where(eq(userApprovals.id, parseInt(approvalId)))
      .limit(1);

    if (approval.length === 0) {
      return NextResponse.json(
        { error: 'Approval request not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const approvalRecord = approval[0];

    // Check if status is 'pendente'
    if (approvalRecord.status !== 'pendente') {
      return NextResponse.json(
        {
          error: 'Approval request has already been processed',
          code: 'ALREADY_PROCESSED',
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update 1: Update users table - approve the user
    await db
      .update(users)
      .set({
        approved: true,
        updatedAt: now,
      })
      .where(eq(users.id, approvalRecord.userId));

    // Update 2: Update user_approvals table - mark as approved
    const updatedApproval = await db
      .update(userApprovals)
      .set({
        status: 'aprovado',
        approvedBy: adminUserId,
        approvedAt: now,
      })
      .where(eq(userApprovals.id, parseInt(approvalId)))
      .returning();

    return NextResponse.json(
      {
        message: 'User approved successfully',
        approval: updatedApproval[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST approval error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}
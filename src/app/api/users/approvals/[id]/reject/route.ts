import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userApprovals, users, congregations } from '@/db/schema';
import { eq } from 'drizzle-orm';
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
    // Extract and validate JWT token
    const authHeader = request.headers.get('authorization');
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
        { error: 'Invalid or expired token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    // Validate approval ID
    const params = await context.params;
    const approvalId = params.id;
    if (!approvalId || isNaN(parseInt(approvalId))) {
      return NextResponse.json(
        { error: 'Valid approval ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { rejectionReason } = body;

    if (!rejectionReason || typeof rejectionReason !== 'string' || rejectionReason.trim() === '') {
      return NextResponse.json(
        { error: 'Rejection reason is required', code: 'MISSING_REJECTION_REASON' },
        { status: 400 }
      );
    }

    // Check admin permissions
    const adminUserId = decoded.userId;
    const adminRole = decoded.role;
    const adminCongregationId = decoded.congregationId;

    // Verify user is admin_geral OR (admin_sede AND isHeadquarters)
    let isAuthorized = false;

    if (adminRole === 'admin_geral') {
      isAuthorized = true;
    } else if (adminRole === 'admin_sede' && adminCongregationId) {
      // Check if admin's congregation is headquarters
      const adminCongregation = await db
        .select()
        .from(congregations)
        .where(eq(congregations.id, adminCongregationId))
        .limit(1);

      if (adminCongregation.length > 0 && adminCongregation[0].isHeadquarters) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { 
          error: 'Forbidden: Only admin_geral or headquarters admin_sede can reject users', 
          code: 'FORBIDDEN' 
        },
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
        { error: 'Approval request not found', code: 'APPROVAL_NOT_FOUND' },
        { status: 404 }
      );
    }

    const approvalRecord = approval[0];

    // Check if approval is still pending
    if (approvalRecord.status !== 'pendente') {
      return NextResponse.json(
        { 
          error: 'Approval request has already been processed', 
          code: 'ALREADY_PROCESSED' 
        },
        { status: 400 }
      );
    }

    // Update 1: Set user as not approved (ensure rejected user cannot login)
    await db
      .update(users)
      .set({
        approved: false,
        updatedAt: new Date().toISOString()
      })
      .where(eq(users.id, approvalRecord.userId));

    // Update 2: Update user_approvals with rejection details
    const updatedApproval = await db
      .update(userApprovals)
      .set({
        status: 'rejeitado',
        approvedBy: adminUserId,
        approvedAt: new Date().toISOString(),
        rejectionReason: rejectionReason.trim()
      })
      .where(eq(userApprovals.id, parseInt(approvalId)))
      .returning();

    return NextResponse.json(
      {
        message: 'User rejected successfully',
        approval: updatedApproval[0]
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}
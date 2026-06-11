import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { memberPermissions, members } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const memberId = params.id;

    // Validate member ID
    if (!memberId || isNaN(parseInt(memberId))) {
      return NextResponse.json(
        {
          error: 'Valid member ID is required',
          code: 'INVALID_MEMBER_ID',
        },
        { status: 400 }
      );
    }

    const memberIdInt = parseInt(memberId);

    // Check if member exists
    const member = await db
      .select()
      .from(members)
      .where(eq(members.id, memberIdInt))
      .limit(1);

    if (member.length === 0) {
      return NextResponse.json(
        {
          error: 'Member not found',
          code: 'MEMBER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Get all permissions for the member
    const permissions = await db
      .select({
        id: memberPermissions.id,
        memberId: memberPermissions.memberId,
        permissionKey: memberPermissions.permissionKey,
        granted: memberPermissions.granted,
        createdAt: memberPermissions.createdAt,
        updatedAt: memberPermissions.updatedAt,
      })
      .from(memberPermissions)
      .where(eq(memberPermissions.memberId, memberIdInt));

    return NextResponse.json(permissions, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const memberId = params.id;

    // Validate member ID
    if (!memberId || isNaN(parseInt(memberId))) {
      return NextResponse.json(
        {
          error: 'Valid member ID is required',
          code: 'INVALID_MEMBER_ID',
        },
        { status: 400 }
      );
    }

    const memberIdInt = parseInt(memberId);

    // Parse request body
    const body = await request.json();
    const { permissions } = body;

    // Validate permissions array
    if (!permissions) {
      return NextResponse.json(
        {
          error: 'Permissions array is required',
          code: 'MISSING_PERMISSIONS',
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        {
          error: 'Permissions must be an array',
          code: 'INVALID_PERMISSIONS_FORMAT',
        },
        { status: 400 }
      );
    }

    // Validate permission keys are non-empty strings
    for (const permission of permissions) {
      if (typeof permission !== 'string' || permission.trim() === '') {
        return NextResponse.json(
          {
            error: 'All permission keys must be non-empty strings',
            code: 'INVALID_PERMISSION_KEY',
          },
          { status: 400 }
        );
      }
    }

    // Check if member exists
    const member = await db
      .select()
      .from(members)
      .where(eq(members.id, memberIdInt))
      .limit(1);

    if (member.length === 0) {
      return NextResponse.json(
        {
          error: 'Member not found',
          code: 'MEMBER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Delete all existing permissions for this member
    await db
      .delete(memberPermissions)
      .where(eq(memberPermissions.memberId, memberIdInt));

    // Insert new permissions
    const now = new Date().toISOString();
    const newPermissions = [];

    if (permissions.length > 0) {
      const permissionsToInsert = permissions.map((permissionKey: string) => ({
        memberId: memberIdInt,
        permissionKey: permissionKey.trim(),
        granted: true,
        createdAt: now,
        updatedAt: now,
      }));

      const inserted = await db
        .insert(memberPermissions)
        .values(permissionsToInsert)
        .returning();

      newPermissions.push(...inserted);
    }

    return NextResponse.json(
      {
        message: 'Permissions updated successfully',
        permissions: newPermissions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
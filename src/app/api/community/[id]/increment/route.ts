import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { communityPosts, congregations, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  congregationId: number;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Extract and verify JWT token
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

    const { userId, role, congregationId } = decoded;

    // Validate ID parameter
    const params = await context.params;
    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { field } = body;

    if (!field) {
      return NextResponse.json(
        { error: 'Field parameter is required', code: 'MISSING_FIELD' },
        { status: 400 }
      );
    }

    const validFields = ['prayers', 'likes', 'comments'];
    if (!validFields.includes(field)) {
      return NextResponse.json(
        {
          error: 'Field must be one of: prayers, likes, comments',
          code: 'INVALID_FIELD',
        },
        { status: 400 }
      );
    }

    // Query community post with congregation join
    const postResult = await db
      .select({
        post: communityPosts,
        congregation: congregations,
        user: users,
      })
      .from(communityPosts)
      .leftJoin(
        congregations,
        eq(communityPosts.congregationId, congregations.id)
      )
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .where(eq(communityPosts.id, parseInt(id)))
      .limit(1);

    if (postResult.length === 0) {
      return NextResponse.json(
        { error: 'Post not found', code: 'POST_NOT_FOUND' },
        { status: 404 }
      );
    }

    const { post, congregation } = postResult[0];

    // Check permissions (same as view permissions)
    let hasPermission = false;

    if (role === 'admin_geral') {
      hasPermission = true;
    } else if (role === 'admin_sede' && congregation?.isHeadquarters) {
      hasPermission = true;
    } else if (
      (role === 'admin_congregacao' || role === 'membro') &&
      post.congregationId === congregationId
    ) {
      hasPermission = true;
    }

    if (!hasPermission) {
      return NextResponse.json(
        {
          error: 'You do not have permission to increment this post',
          code: 'PERMISSION_DENIED',
        },
        { status: 403 }
      );
    }

    // Determine which counter to increment
    let updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (field === 'prayers') {
      updateData.prayersCount = (post.prayersCount || 0) + 1;
    } else if (field === 'likes') {
      updateData.likesCount = (post.likesCount || 0) + 1;
    } else if (field === 'comments') {
      updateData.commentsCount = (post.commentsCount || 0) + 1;
    }

    // Update the post
    const updatedPost = await db
      .update(communityPosts)
      .set(updateData)
      .where(eq(communityPosts.id, parseInt(id)))
      .returning();

    if (updatedPost.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update post', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    // Fetch the updated post with joins
    const finalResult = await db
      .select({
        post: communityPosts,
        congregation: congregations,
        user: users,
      })
      .from(communityPosts)
      .leftJoin(
        congregations,
        eq(communityPosts.congregationId, congregations.id)
      )
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .where(eq(communityPosts.id, parseInt(id)))
      .limit(1);

    return NextResponse.json(finalResult[0], { status: 200 });
  } catch (error: any) {
    console.error('POST increment error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + error.message,
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
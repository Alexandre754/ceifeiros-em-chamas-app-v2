import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { communityPosts, users, congregations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ipcecma-secret-key-2024';

interface JWTPayload {
  userId: number;
  role: string;
  congregationId: number;
}

function verifyToken(request: NextRequest): JWTPayload | null {
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

async function canAccessPost(
  user: JWTPayload,
  post: any
): Promise<boolean> {
  if (user.role === 'admin_geral') {
    return true;
  }

  if (user.role === 'admin_sede') {
    const userCongregation = await db.select()
      .from(congregations)
      .where(eq(congregations.id, user.congregationId))
      .limit(1);

    if (userCongregation.length > 0 && userCongregation[0].isHeadquarters) {
      return true;
    }
  }

  if (user.congregationId === post.congregationId) {
    return true;
  }

  return false;
}

async function canModifyPost(
  user: JWTPayload,
  post: any
): Promise<boolean> {
  if (post.userId === user.userId) {
    return true;
  }

  if (user.role === 'admin_geral') {
    return true;
  }

  if (user.role === 'admin_sede') {
    const userCongregation = await db.select()
      .from(congregations)
      .where(eq(congregations.id, user.congregationId))
      .limit(1);

    if (userCongregation.length > 0 && userCongregation[0].isHeadquarters) {
      return true;
    }
  }

  if (user.role === 'admin_congregacao' && user.congregationId === post.congregationId) {
    return true;
  }

  return false;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const postId = parseInt(id);

    const postResult = await db.select({
      id: communityPosts.id,
      congregationId: communityPosts.congregationId,
      userId: communityPosts.userId,
      type: communityPosts.type,
      title: communityPosts.title,
      content: communityPosts.content,
      prayersCount: communityPosts.prayersCount,
      likesCount: communityPosts.likesCount,
      commentsCount: communityPosts.commentsCount,
      status: communityPosts.status,
      createdAt: communityPosts.createdAt,
      updatedAt: communityPosts.updatedAt,
      congregation: {
        id: congregations.id,
        name: congregations.name,
        city: congregations.city,
        state: congregations.state,
        isHeadquarters: congregations.isHeadquarters,
      },
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      },
    })
      .from(communityPosts)
      .leftJoin(congregations, eq(communityPosts.congregationId, congregations.id))
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .where(eq(communityPosts.id, postId))
      .limit(1);

    if (postResult.length === 0) {
      return NextResponse.json(
        { error: 'Community post not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const post = postResult[0];

    const hasAccess = await canAccessPost(user, post);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    return NextResponse.json(post, { status: 200 });
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const postId = parseInt(id);

    const existingPost = await db.select()
      .from(communityPosts)
      .where(eq(communityPosts.id, postId))
      .limit(1);

    if (existingPost.length === 0) {
      return NextResponse.json(
        { error: 'Community post not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const post = existingPost[0];

    const canModify = await canModifyPost(user, post);
    if (!canModify) {
      return NextResponse.json(
        { error: 'Insufficient permissions to modify this post', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();

    if ('userId' in body || 'user_id' in body || 'congregationId' in body || 'congregation_id' in body) {
      return NextResponse.json(
        { error: 'User ID and Congregation ID cannot be modified', code: 'FORBIDDEN_FIELDS' },
        { status: 400 }
      );
    }

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (body.type !== undefined) {
      const validTypes = ['prayer', 'testimony', 'forum'];
      if (!validTypes.includes(body.type)) {
        return NextResponse.json(
          { error: 'Type must be "prayer", "testimony", or "forum"', code: 'INVALID_TYPE' },
          { status: 400 }
        );
      }
      updates.type = body.type;
    }

    if (body.title !== undefined) {
      const trimmedTitle = body.title.trim();
      if (!trimmedTitle) {
        return NextResponse.json(
          { error: 'Title cannot be empty', code: 'INVALID_TITLE' },
          { status: 400 }
        );
      }
      updates.title = trimmedTitle;
    }

    if (body.content !== undefined) {
      const trimmedContent = body.content.trim();
      if (!trimmedContent) {
        return NextResponse.json(
          { error: 'Content cannot be empty', code: 'INVALID_CONTENT' },
          { status: 400 }
        );
      }
      updates.content = trimmedContent;
    }

    if (body.prayersCount !== undefined) {
      updates.prayersCount = parseInt(body.prayersCount);
    }

    if (body.likesCount !== undefined) {
      updates.likesCount = parseInt(body.likesCount);
    }

    if (body.commentsCount !== undefined) {
      updates.commentsCount = parseInt(body.commentsCount);
    }

    if (body.status !== undefined) {
      updates.status = body.status;
    }

    const updatedPost = await db.update(communityPosts)
      .set(updates)
      .where(eq(communityPosts.id, postId))
      .returning();

    if (updatedPost.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update community post', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    const postWithRelations = await db.select({
      id: communityPosts.id,
      congregationId: communityPosts.congregationId,
      userId: communityPosts.userId,
      type: communityPosts.type,
      title: communityPosts.title,
      content: communityPosts.content,
      prayersCount: communityPosts.prayersCount,
      likesCount: communityPosts.likesCount,
      commentsCount: communityPosts.commentsCount,
      status: communityPosts.status,
      createdAt: communityPosts.createdAt,
      updatedAt: communityPosts.updatedAt,
      congregation: {
        id: congregations.id,
        name: congregations.name,
        city: congregations.city,
        state: congregations.state,
        isHeadquarters: congregations.isHeadquarters,
      },
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      },
    })
      .from(communityPosts)
      .leftJoin(congregations, eq(communityPosts.congregationId, congregations.id))
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .where(eq(communityPosts.id, postId))
      .limit(1);

    return NextResponse.json(postWithRelations[0], { status: 200 });
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const postId = parseInt(id);

    const existingPost = await db.select()
      .from(communityPosts)
      .where(eq(communityPosts.id, postId))
      .limit(1);

    if (existingPost.length === 0) {
      return NextResponse.json(
        { error: 'Community post not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const post = existingPost[0];

    const canModify = await canModifyPost(user, post);
    if (!canModify) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this post', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const deleted = await db.update(communityPosts)
      .set({
        status: 'inativo',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(communityPosts.id, postId))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete community post', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Community post deleted successfully',
        id: postId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
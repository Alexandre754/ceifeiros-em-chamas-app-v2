import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assets, users, congregations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'ipcecma-secret-key-2024';

interface JWTPayload {
  userId: number;
  role: string;
  congregationId: number;
}

interface AssetUpdatePayload {
  name?: string;
  category?: string;
  subcategory?: string;
  location?: string;
  propertyType?: string;
  acquisitionDate?: string;
  acquisitionValue?: number;
  currentValue?: number;
  condition?: string;
  description?: string;
  serialNumber?: string;
  photoUrl?: string;
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

async function checkAssetPermission(
  assetCongregationId: number,
  userPayload: JWTPayload,
  requireModify: boolean = false
): Promise<{ allowed: boolean; error?: string }> {
  if (requireModify && userPayload.role === 'membro') {
    return { allowed: false, error: 'Members do not have permission to modify or delete assets' };
  }

  if (userPayload.role === 'admin_geral') {
    return { allowed: true };
  }

  const userCongregation = await db.select()
    .from(congregations)
    .where(eq(congregations.id, userPayload.congregationId))
    .limit(1);

  if (userPayload.role === 'admin_sede' && userCongregation[0]?.isHeadquarters) {
    return { allowed: true };
  }

  if (userPayload.role === 'admin_congregacao' || userPayload.role === 'membro') {
    if (assetCongregationId !== userPayload.congregationId) {
      return { allowed: false, error: 'You do not have permission to access this asset' };
    }
    return { allowed: true };
  }

  if (userPayload.role === 'admin_sede') {
    if (assetCongregationId !== userPayload.congregationId) {
      return { allowed: false, error: 'You do not have permission to access this asset' };
    }
    return { allowed: true };
  }

  return { allowed: false, error: 'Invalid role' };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userPayload = await verifyToken(request);
    if (!userPayload) {
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

    const asset = await db.select({
      id: assets.id,
      congregationId: assets.congregationId,
      name: assets.name,
      category: assets.category,
      subcategory: assets.subcategory,
      location: assets.location,
      propertyType: assets.propertyType,
      acquisitionDate: assets.acquisitionDate,
      acquisitionValue: assets.acquisitionValue,
      currentValue: assets.currentValue,
      condition: assets.condition,
      description: assets.description,
      serialNumber: assets.serialNumber,
      photoUrl: assets.photoUrl,
      status: assets.status,
      createdAt: assets.createdAt,
      updatedAt: assets.updatedAt,
      congregation: {
        id: congregations.id,
        name: congregations.name,
        city: congregations.city,
        state: congregations.state,
        address: congregations.address,
        isHeadquarters: congregations.isHeadquarters,
      },
    })
      .from(assets)
      .leftJoin(congregations, eq(assets.congregationId, congregations.id))
      .where(eq(assets.id, parseInt(id)))
      .limit(1);

    if (asset.length === 0) {
      return NextResponse.json(
        { error: 'Asset not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const permissionCheck = await checkAssetPermission(
      asset[0].congregationId,
      userPayload,
      false
    );

    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.error || 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    return NextResponse.json(asset[0], { status: 200 });
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
    const userPayload = await verifyToken(request);
    if (!userPayload) {
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

    const existingAsset = await db.select()
      .from(assets)
      .where(eq(assets.id, parseInt(id)))
      .limit(1);

    if (existingAsset.length === 0) {
      return NextResponse.json(
        { error: 'Asset not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const permissionCheck = await checkAssetPermission(
      existingAsset[0].congregationId,
      userPayload,
      true
    );

    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.error || 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body: AssetUpdatePayload = await request.json();

    if (body.name !== undefined && body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Name cannot be empty', code: 'INVALID_NAME' },
        { status: 400 }
      );
    }

    if (body.category !== undefined) {
      const validCategories = ['imovel', 'veiculo', 'equipamento', 'ferramenta'];
      if (!validCategories.includes(body.category)) {
        return NextResponse.json(
          { error: 'Category must be imovel, veiculo, equipamento, or ferramenta', code: 'INVALID_CATEGORY' },
          { status: 400 }
        );
      }
    }

    if (body.propertyType !== undefined) {
      const validPropertyTypes = ['proprio', 'alugado'];
      if (!validPropertyTypes.includes(body.propertyType)) {
        return NextResponse.json(
          { error: 'Property type must be proprio or alugado', code: 'INVALID_PROPERTY_TYPE' },
          { status: 400 }
        );
      }
    }

    if (body.condition !== undefined) {
      const validConditions = ['otimo', 'bom', 'regular', 'ruim'];
      if (!validConditions.includes(body.condition)) {
        return NextResponse.json(
          { error: 'Condition must be otimo, bom, regular, or ruim', code: 'INVALID_CONDITION' },
          { status: 400 }
        );
      }
    }

    if (body.acquisitionValue !== undefined && body.acquisitionValue < 0) {
      return NextResponse.json(
        { error: 'Acquisition value must be non-negative', code: 'INVALID_ACQUISITION_VALUE' },
        { status: 400 }
      );
    }

    if (body.currentValue !== undefined && body.currentValue < 0) {
      return NextResponse.json(
        { error: 'Current value must be non-negative', code: 'INVALID_CURRENT_VALUE' },
        { status: 400 }
      );
    }

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (body.name !== undefined) updateData.name = body.name ? body.name.trim() : null;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.subcategory !== undefined) updateData.subcategory = body.subcategory ? body.subcategory.trim() : null;
    if (body.location !== undefined) updateData.location = body.location ? body.location.trim() : null;
    if (body.propertyType !== undefined) updateData.propertyType = body.propertyType;
    if (body.acquisitionDate !== undefined) updateData.acquisitionDate = body.acquisitionDate;
    if (body.acquisitionValue !== undefined) updateData.acquisitionValue = body.acquisitionValue;
    if (body.currentValue !== undefined) updateData.currentValue = body.currentValue;
    if (body.condition !== undefined) updateData.condition = body.condition;
    if (body.description !== undefined) updateData.description = body.description ? body.description.trim() : null;
    if (body.serialNumber !== undefined) updateData.serialNumber = body.serialNumber ? body.serialNumber.trim() : null;
    if (body.photoUrl !== undefined) updateData.photoUrl = body.photoUrl ? body.photoUrl.trim() : null;

    const updated = await db.update(assets)
      .set(updateData)
      .where(eq(assets.id, parseInt(id)))
      .returning();

    const updatedAsset = await db.select({
      id: assets.id,
      congregationId: assets.congregationId,
      name: assets.name,
      category: assets.category,
      subcategory: assets.subcategory,
      location: assets.location,
      propertyType: assets.propertyType,
      acquisitionDate: assets.acquisitionDate,
      acquisitionValue: assets.acquisitionValue,
      currentValue: assets.currentValue,
      condition: assets.condition,
      description: assets.description,
      serialNumber: assets.serialNumber,
      photoUrl: assets.photoUrl,
      status: assets.status,
      createdAt: assets.createdAt,
      updatedAt: assets.updatedAt,
      congregation: {
        id: congregations.id,
        name: congregations.name,
        city: congregations.city,
        state: congregations.state,
        address: congregations.address,
        isHeadquarters: congregations.isHeadquarters,
      },
    })
      .from(assets)
      .leftJoin(congregations, eq(assets.congregationId, congregations.id))
      .where(eq(assets.id, parseInt(id)))
      .limit(1);

    return NextResponse.json(updatedAsset[0], { status: 200 });
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
    const userPayload = await verifyToken(request);
    if (!userPayload) {
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

    const existingAsset = await db.select()
      .from(assets)
      .where(eq(assets.id, parseInt(id)))
      .limit(1);

    if (existingAsset.length === 0) {
      return NextResponse.json(
        { error: 'Asset not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const permissionCheck = await checkAssetPermission(
      existingAsset[0].congregationId,
      userPayload,
      true
    );

    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.error || 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const deleted = await db.update(assets)
      .set({
        status: 'inativo',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(assets.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      { 
        message: 'Asset deleted successfully', 
        id: parseInt(id)
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
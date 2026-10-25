import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assets, users, congregations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

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
  // membro cannot modify or delete
  if (requireModify && userPayload.role === 'membro') {
    return { allowed: false, error: 'Members do not have permission to modify or delete assets' };
  }

  // admin_geral has full access
  if (userPayload.role === 'admin_geral') {
    return { allowed: true };
  }

  // Check if user's congregation is headquarters
  const userCongregation = await db.select()
    .from(congregations)
    .where(eq(congregations.id, userPayload.congregationId))
    .limit(1);

  // admin_sede from headquarters has full access
  if (userPayload.role === 'admin_sede' && userCongregation[0]?.isHeadquarters) {
    return { allowed: true };
  }

  // admin_congregacao and membro can only access their congregation's assets
  if (userPayload.role === 'admin_congregacao' || userPayload.role === 'membro') {
    if (assetCongregationId !== userPayload.congregationId) {
      return { allowed: false, error: 'You do not have permission to access this asset' };
    }
    return { allowed: true };
  }

  // admin_sede from non-headquarters can only access their congregation
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
    // Verify JWT token
    const userPayload = await verifyToken(request);
    if (!userPayload) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Validate id parameter
    const params = await context.params;
    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Query asset with join to congregations
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

    // Check if asset exists
    if (asset.length === 0) {
      return NextResponse.json(
        { error: 'Asset not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check permission
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
    // Verify JWT token
    const userPayload = await verifyToken(request);
    if (!userPayload) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Validate id parameter
    const params = await context.params;
    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if asset exists
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

    // Check permission (requireModify = true)
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

    // Parse request body
    const body: AssetUpdatePayload = await request.json();

    // Validate name if provided
    if (body.name !== undefined && body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Name cannot be empty', code: 'INVALID_NAME' },
        { status: 400 }
      );
    }

    // Validate category if provided
    if (body.category !== undefined) {
      const validCategories = ['imovel', 'veiculo', 'equipamento', 'ferramenta'];
      if (!validCategories.includes(body.category)) {
        return NextResponse.json(
          { error: 'Category must be imovel, veiculo, equipamento, or ferramenta', code: 'INVALID_CATEGORY' },
          { status: 400 }
        );
      }
    }

    // Validate propertyType if provided
    if (body.propertyType !== undefined) {
      const validPropertyTypes = ['proprio', 'alugado'];
      if (!validPropertyTypes.includes(body.propertyType)) {
        return NextResponse.json(
          { error: 'Property type must be proprio or alugado', code: 'INVALID_PROPERTY_TYPE' },
          { status: 400 }
        );
      }
    }

    // Validate condition if provided
    if (body.condition !== undefined) {
      const validConditions = ['otimo', 'bom', 'regular', 'ruim'];
      if (!validConditions.includes(body.condition)) {
        return NextResponse.json(
          { error: 'Condition must be otimo, bom, regular, or ruim', code: 'INVALID_CONDITION' },
          { status: 400 }
        );
      }
    }

    // Validate acquisitionValue if provided
    if (body.acquisitionValue !== undefined && body.acquisitionValue < 0) {
      return NextResponse.json(
        { error: 'Acquisition value must be non-negative', code: 'INVALID_ACQUISITION_VALUE' },
        { status: 400 }
      );
    }

    // Validate currentValue if provided
    if (body.currentValue !== undefined && body.currentValue < 0) {
      return NextResponse.json(
        { error: 'Current value must be non-negative', code: 'INVALID_CURRENT_VALUE' },
        { status: 400 }
      );
    }

    // Prepare update object with trimmed strings
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

    // Update asset with returning
    const updated = await db.update(assets)
      .set(updateData)
      .where(eq(assets.id, parseInt(id)))
      .returning();

    // Return updated asset with join
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
    // Verify JWT token
    const userPayload = await verifyToken(request);
    if (!userPayload) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Validate id parameter
    const params = await context.params;
    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if asset exists
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

    // Check permission (requireModify = true)
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

    // Soft delete: set status='inativo', update updatedAt
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
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const settingsRecord = await db.select()
      .from(settings)
      .limit(1);

    if (settingsRecord.length === 0) {
      return NextResponse.json({ 
        error: 'Settings not found - please configure',
        code: 'SETTINGS_NOT_FOUND' 
      }, { status: 404 });
    }

    return NextResponse.json(settingsRecord[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate email format if email is being updated
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json({ 
          error: 'Invalid email format',
          code: 'INVALID_EMAIL' 
        }, { status: 400 });
      }
    }

    // Trim all string values
    const trimmedData: any = {};
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string') {
        trimmedData[key] = value.trim();
      } else {
        trimmedData[key] = value;
      }
    }

    // Check if settings record exists
    const existingSettings = await db.select()
      .from(settings)
      .limit(1);

    let result;

    if (existingSettings.length === 0) {
      // Create new settings record with id=1
      const newSettings = {
        ...trimmedData,
        language: trimmedData.language ?? 'pt-BR',
        currency: trimmedData.currency ?? 'BRL',
          emailNotifications: trimmedData.emailNotifications ?? true,
          smsNotifications: trimmedData.smsNotifications ?? false,
          whatsappNotifications: trimmedData.whatsappNotifications ?? false,
          pushNotifications: trimmedData.pushNotifications ?? true,
        birthdayReminders: trimmedData.birthdayReminders ?? true,
        eventReminders: trimmedData.eventReminders ?? true,
        financialReports: trimmedData.financialReports ?? true,
        updatedAt: new Date().toISOString()
      };

      result = await db.insert(settings)
        .values(newSettings)
        .returning();
    } else {
      // Update existing settings record
      const updateData = {
        ...trimmedData,
        updatedAt: new Date().toISOString()
      };

      result = await db.update(settings)
        .set(updateData)
        .where(eq(settings.id, existingSettings[0].id))
        .returning();
    }

    return NextResponse.json(result[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}
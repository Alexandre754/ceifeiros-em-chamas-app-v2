import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions } from '@/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const congregationId = searchParams.get('congregationId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!congregationId) {
      return NextResponse.json(
        { error: 'Congregation ID is required' },
        { status: 400 }
      );
    }

    const whereCondition = startDate && endDate
      ? and(
          eq(transactions.congregationId, parseInt(congregationId)),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      : eq(transactions.congregationId, parseInt(congregationId));

    const allTransactions = await db
      .select()
      .from(transactions)
      .where(whereCondition);

    const income = allTransactions
      .filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = allTransactions
      .filter(t => t.type === 'saida')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const balance = income - expenses;

    const incomeByCategory = allTransactions
      .filter(t => t.type === 'entrada')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const expensesByCategory = allTransactions
      .filter(t => t.type === 'saida')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
        return acc;
      }, {} as Record<string, number>);

    return NextResponse.json({
      transactions: allTransactions,
      summary: {
        income,
        expenses,
        balance,
        incomeByCategory,
        expensesByCategory,
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

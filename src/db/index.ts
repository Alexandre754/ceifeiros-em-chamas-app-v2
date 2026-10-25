import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '@/db/schema';

// FORÇANDO O USO DO BANCO LOCAL (SEM LIMITES!)
const client = createClient({
  url: 'file:local.db',
});

export const db = drizzle(client, { schema });
export type Database = typeof db;
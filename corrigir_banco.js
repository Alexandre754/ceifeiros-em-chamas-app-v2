const { createClient } = require('@libsql/client');

async function main() {
  const client = createClient({ url: 'file:local.db' });

  console.log('🔧 Corrigindo o banco de dados...');

  // 1. Corrigir a tabela banners (adicionar a coluna "order" que o Drizzle espera)
  try {
    await client.execute(`ALTER TABLE banners ADD COLUMN "order" INTEGER DEFAULT 0`);
    console.log('✅ Coluna "order" adicionada na tabela banners.');
  } catch (e) {
    console.log('ℹ️ Coluna "order" já existe na tabela banners.');
  }

  // 2. Criar a tabela congregations (que está faltando)
  await client.execute(`
    CREATE TABLE IF NOT EXISTS congregations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      address TEXT,
      is_headquarters INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  console.log('✅ Tabela congregations criada.');

  // 3. Inserir uma congregação padrão (para o admin ter uma)
  const existing = await client.execute(`SELECT id FROM congregations LIMIT 1`);
  if (existing.rows.length === 0) {
    await client.execute(`
      INSERT INTO congregations (name, city, state, is_headquarters) 
      VALUES ('Igreja Pentecostal Ceifeiros em Chamas', 'Atibaia', 'SP', 1)
    `);
    console.log('✅ Congregação padrão criada.');
  } else {
    console.log('ℹ️ Já existe uma congregação cadastrada.');
  }

  // 4. Listar todas as tabelas para conferir
  const tabelas = await client.execute(`SELECT name FROM sqlite_master WHERE type='table'`);
  console.log('\n📋 Tabelas no banco:', tabelas.rows.map(r => r.name).join(', '));

  console.log('\n🎉 Banco de dados corrigido!');
  client.close();
}

main().catch(console.error);
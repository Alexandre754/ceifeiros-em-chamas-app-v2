const { createClient } = require('@libsql/client');

async function main() {
  const client = createClient({ url: 'file:local.db' });

  console.log('🌱 Criando tabela members...');

  await client.execute(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      congregation_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      cpf TEXT UNIQUE,
      rg TEXT,
      birth_date TEXT NOT NULL,
      age INTEGER,
      sex TEXT NOT NULL,
      marital_status TEXT,
      spouse TEXT,
      email TEXT,
      phone TEXT NOT NULL,
      address TEXT,
      cep TEXT,
      neighborhood TEXT,
      city TEXT,
      state TEXT,
      position TEXT NOT NULL,
      baptism_date TEXT,
      member_since TEXT,
      photo_url TEXT,
      member_level_id INTEGER,
      status TEXT NOT NULL DEFAULT 'ativo',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  console.log('✅ Tabela members criada!');

  // Listar todas as tabelas
  const tabelas = await client.execute(`SELECT name FROM sqlite_master WHERE type='table'`);
  console.log('📋 Tabelas no banco:', tabelas.rows.map(r => r.name).join(', '));
  
  console.log('🎉 Banco de dados COMPLETO!');
  client.close();
}

main().catch(console.error);
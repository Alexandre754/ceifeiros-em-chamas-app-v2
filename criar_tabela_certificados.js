const { createClient } = require('@libsql/client');

async function main() {
  const client = createClient({ url: 'file:local.db' });

  console.log('🌱 Criando tabela certificate_templates...');

  await client.execute(`
    CREATE TABLE IF NOT EXISTS certificate_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      content TEXT NOT NULL,
      fields TEXT NOT NULL,
      background_image TEXT,
      frame_image TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  console.log('✅ Tabela certificate_templates criada!');
  client.close();
}

main().catch(console.error);
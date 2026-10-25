const { createClient } = require('@libsql/client');

async function main() {
  const client = createClient({ url: 'file:local.db' });

  console.log('🔧 Corrigindo tabela banners...');

  // Deleta a tabela antiga (se existir)
  await client.execute(`DROP TABLE IF EXISTS banners`);

  // Cria a tabela nova, sem a coluna "order"
  await client.execute(`
    CREATE TABLE banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      image_url TEXT NOT NULL,
      link_url TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      start_date TEXT,
      end_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  console.log('✅ Tabela banners corrigida!');
  client.close();
}

main().catch(console.error);
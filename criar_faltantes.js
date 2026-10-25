const { createClient } = require('@libsql/client');

async function main() {
  const client = createClient({ url: 'file:local.db' });

  console.log('🌱 Criando tabelas que faltam...');

  // 1. Tabela member_permissions
  await client.execute(`
    CREATE TABLE IF NOT EXISTS member_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      user_id INTEGER,
      permission_key TEXT NOT NULL,
      granted INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  console.log('✅ Tabela member_permissions criada.');

  // 2. Tabela events
  await client.execute(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      congregation_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      start_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_date TEXT NOT NULL,
      end_time TEXT NOT NULL,
      day1_date TEXT, day1_time TEXT, day2_date TEXT, day2_time TEXT, day3_date TEXT, day3_time TEXT,
      location TEXT, media_url TEXT, media_type TEXT, category TEXT, attendance INTEGER, created_by INTEGER,
      status TEXT NOT NULL DEFAULT 'ativo',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  console.log('✅ Tabela events criada.');

  // 3. Tabela settings
  await client.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      church_name TEXT NOT NULL,
      acronym TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      city TEXT,
      state TEXT,
      language TEXT DEFAULT 'pt-BR',
      currency TEXT DEFAULT 'BRL',
      email_notifications INTEGER NOT NULL DEFAULT 1,
      sms_notifications INTEGER NOT NULL DEFAULT 0,
      push_notifications INTEGER NOT NULL DEFAULT 1,
      birthday_reminders INTEGER NOT NULL DEFAULT 1,
      event_reminders INTEGER NOT NULL DEFAULT 1,
      financial_reports INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  console.log('✅ Tabela settings criada.');

  // 4. Tabela transactions
  await client.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      congregation_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      description TEXT,
      payment_method TEXT,
      account_id TEXT,
      tithe_giver_name TEXT,
      created_by INTEGER,
      status TEXT NOT NULL DEFAULT 'ativo',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  console.log('✅ Tabela transactions criada.');

  // 5. Tabela sermons
  await client.execute(`
    CREATE TABLE IF NOT EXISTS sermons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      congregation_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      preacher TEXT NOT NULL,
      date TEXT NOT NULL,
      duration TEXT,
      category TEXT,
      description TEXT,
      media_url TEXT,
      media_type TEXT,
      thumbnail_url TEXT,
      views INTEGER DEFAULT 0,
      downloads INTEGER DEFAULT 0,
      created_by INTEGER,
      status TEXT NOT NULL DEFAULT 'ativo',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  console.log('✅ Tabela sermons criada.');

  // 6. Tabela community_posts
  await client.execute(`
    CREATE TABLE IF NOT EXISTS community_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      congregation_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      prayers_count INTEGER DEFAULT 0,
      likes_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'ativo',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  console.log('✅ Tabela community_posts criada.');

  // 7. Tabela assets
  await client.execute(`
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      congregation_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT,
      location TEXT,
      property_type TEXT,
      acquisition_date TEXT,
      acquisition_value REAL,
      current_value REAL,
      condition TEXT,
      description TEXT,
      serial_number TEXT,
      photo_url TEXT,
      status TEXT NOT NULL DEFAULT 'ativo',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  console.log('✅ Tabela assets criada.');

  // 8. Tabela user_approvals
  await client.execute(`
    CREATE TABLE IF NOT EXISTS user_approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pendente',
      requested_at TEXT NOT NULL DEFAULT (datetime('now')),
      approved_by INTEGER,
      approved_at TEXT,
      rejection_reason TEXT
    );
  `);
  console.log('✅ Tabela user_approvals criada.');

  // 9. Tabela user_congregation_access
  await client.execute(`
    CREATE TABLE IF NOT EXISTS user_congregation_access (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      congregation_id INTEGER NOT NULL,
      access_level TEXT NOT NULL,
      granted_at TEXT NOT NULL DEFAULT (datetime('now')),
      granted_by INTEGER
    );
  `);
  console.log('✅ Tabela user_congregation_access criada.');

  // 10. Tabela member_levels
  await client.execute(`
    CREATE TABLE IF NOT EXISTS member_levels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      level INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  console.log('✅ Tabela member_levels criada.');

  // Listar todas as tabelas
  const tabelas = await client.execute(`SELECT name FROM sqlite_master WHERE type='table'`);
  console.log('\n📋 Tabelas no banco:', tabelas.rows.map(r => r.name).join(', '));

  console.log('\n🎉 Banco de dados completo!');
  client.close();
}

main().catch(console.error);
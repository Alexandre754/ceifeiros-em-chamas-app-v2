require('dotenv').config(); // Carrega as variáveis do .env
const { createClient } = require('@libsql/client');
const bcrypt = require('bcrypt');

async function main() {
  // Conecta no Turso
  const client = createClient({ 
    url: process.env.TURSO_CONNECTION_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  console.log('🌱 Criando usuário admin...');

  // Criptografa a senha
  const hashedPassword = await bcrypt.hash('admin123', 10);

  try {
    // Insere o usuário admin
    await client.execute({
      sql: `INSERT OR IGNORE INTO users (name, email, password, original_password, role, approved, has_general_access) VALUES (?, ?, ?, ?, ?, 1, 1)`,
      args: ['Administrador', 'admin@admin.com', hashedPassword, 'admin123', 'admin_geral']
    });

    console.log('✅ Usuário admin criado com sucesso!');
    console.log('🎉 Use admin@admin.com e a senha admin123 para logar.');
  } catch (error) {
    console.error('❌ Erro ao criar admin:', error);
  } finally {
    client.close();
  }
}

main().catch(console.error);
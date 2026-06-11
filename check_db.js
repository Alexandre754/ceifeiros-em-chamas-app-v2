const { createClient } = require('@libsql/client');
require('dotenv').config();

async function check() {
  const client = createClient({
    url: process.env.TURSO_CONNECTION_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    const res = await client.execute("PRAGMA table_info(member_permissions);");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (error) {
    console.error('Check error:', error);
  } finally {
    client.close();
  }
}

check();

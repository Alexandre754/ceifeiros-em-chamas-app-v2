const { createClient } = require('@libsql/client');
require('dotenv').config();

async function check() {
  const client = createClient({
    url: process.env.TURSO_CONNECTION_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    const res = await client.execute('select "permission_key", "granted" from "member_permissions" where "user_id" = 1');
    console.log('Success!', res.rows.length);
  } catch (error) {
    console.error('Query error:', error);
  } finally {
    client.close();
  }
}

check();

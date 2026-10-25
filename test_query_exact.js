const { createClient } = require('@libsql/client');
require('dotenv').config();

async function check() {
  const client = createClient({
    url: process.env.TURSO_CONNECTION_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    const query = 'select "permission_key", "granted" from "member_permissions" where ("member_permissions"."user_id" = ? or "member_permissions"."member_id" = (select "id" from "members" where "members"."email" = ?))';
    const res = await client.execute({ sql: query, args: [14, 'planetaecosistem@gmail.com'] });
    console.log('Success!', res.rows.length);
  } catch (error) {
    console.error('Query error:', error);
  } finally {
    client.close();
  }
}

check();

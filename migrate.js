const { createClient } = require('@libsql/client');
require('dotenv').config();

async function migrate() {
  const client = createClient({
    url: process.env.TURSO_CONNECTION_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    console.log('Checking and adding columns to Turso...');
    
    // Add whatsapp_notifications to settings
    try {
      await client.execute("ALTER TABLE settings ADD COLUMN whatsapp_notifications INTEGER DEFAULT 0;");
      console.log('Column whatsapp_notifications added to settings.');
    } catch (e) {
      if (e.message.includes('duplicate column name')) {
        console.log('Column whatsapp_notifications already exists in settings.');
      } else {
        throw e;
      }
    }

    // Add user_id to member_permissions
    try {
      await client.execute("ALTER TABLE member_permissions ADD COLUMN user_id INTEGER REFERENCES users(id);");
      console.log('Column user_id added to member_permissions.');
    } catch (e) {
      if (e.message.includes('duplicate column name')) {
        console.log('Column user_id already exists in member_permissions.');
      } else {
        throw e;
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    client.close();
  }
}

migrate();

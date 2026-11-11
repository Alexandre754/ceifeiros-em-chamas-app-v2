import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: 'libsql://db-3e5011e3-3850-4e46-85d3-c6c3e10a2fcd-orchids.aws-us-west-2.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3Njc3NDU1NzcsImlkIjoiYjY1MWE0MzktNDgzNS00MzQ5LWJkMzItM2U3ODFjYzNkNWEyIiwicmlkIjoiNjU3ZTgwNDUtZDA0Mi00M2FmLTg3NzctNDVjYjQ2Y2E5ZmFiIn0.lpEEBioMKuLKlbOLRwNEEIVBXGAKAiLMXT3cu5kUZhRDZo6EtstsQ7DJcJ0uuJqNssocRlIwRnfEj7zSPgGCBw',
  },
});
import { defineConfig } from 'prisma/config';

// Used by the Prisma CLI (migrate dev/deploy); the runtime client in
// src/prismaStore.mjs connects through its own pg driver adapter.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
});

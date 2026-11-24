import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    env: {
      JWT_SECRET: 'e2e-secret-que-no-se-usa-en-produccion-0123456789',
      DATA_ENCRYPTION_KEY: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      DATABASE_URL: 'postgresql://x:x@localhost:5432/x',
    },
  },
});

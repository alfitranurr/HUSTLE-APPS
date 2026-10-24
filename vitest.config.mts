import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // Unit tests only; the database/RLS suite runs with `npm run test:db`.
  test: { include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'] },
});

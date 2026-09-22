import {defineConfig} from 'vitest/config'
import react from '@vitejs/plugin-react'

// Unit tests only. E2E specs under tests/e2e are driven by Playwright and must
// not be collected here (they import @playwright/test, which vitest cannot run).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**', 'node_modules/**', '.next/**'],
    restoreMocks: true,
  },
})

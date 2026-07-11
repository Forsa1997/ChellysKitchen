import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    deps: {
      // Pre-bundle the icon package: importing its ~11k module files directly
      // exceeds macOS' per-process open-file limit (kern.maxfilesperproc).
      optimizer: {
        ssr: { enabled: true, include: ['@mui/icons-material'] },
        client: { enabled: true, include: ['@mui/icons-material'] },
      },
    },
  },
});

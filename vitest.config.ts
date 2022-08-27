import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  mode: 'development',
  plugins: [react()],
  define: { __DEV__: JSON.stringify(true) },
  test: {
    // We need to simulate a DOM environment, otherwise "useSyncExternalStore/shim"
    // will infer a server environment and will work differently.
    environment: 'happy-dom',
    globals: true,
    coverage: {
      all: true,
      src: ['src'],
      reporter: ['json'],
    },
  },
});

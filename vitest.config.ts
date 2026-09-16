import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'resources/js'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['resources/js/test/setup.ts'],
    // Timeout padrão (5s) estoura sob carga (vários arquivos rodando em paralelo);
    // os testes usam debounce real de 300ms + interações assíncronas do userEvent.
    testTimeout: 15000,
  },
});

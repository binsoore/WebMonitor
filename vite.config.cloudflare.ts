import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'client',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    minify: false, // 빌드 속도 향상
    rollupOptions: {
      external: [], // 모든 의존성 번들에 포함
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'] // 주요 의존성 사전 번들링
  }
});
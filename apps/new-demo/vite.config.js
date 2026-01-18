import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './public/demo.html'
      }
    }
  },
  server: {
    port: 3002,
    open: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
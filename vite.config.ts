import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync } from 'fs';

export default defineConfig({
  plugins: [
    {
      name: 'copy-keywords',
      closeBundle() {
        try {
          copyFileSync('keywords/keywords.txt', 'dist/keywords.txt');
        } catch (e) {
          console.error('Gagal copy keywords.txt:', e);
        }
      }
    }
  ],
  build: {
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        content: resolve(__dirname, 'src/content/content.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]', 
        chunkFileNames: '[name].js',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, existsSync, mkdirSync } from 'fs';

// Plugin to copy manifest.json and icons
function copyManifest() {
  return {
    name: 'copy-manifest',
    writeBundle() {
      const manifestPath = resolve(__dirname, 'manifest.json');
      const distPath = resolve(__dirname, 'dist');
      
      if (!existsSync(distPath)) {
        mkdirSync(distPath, { recursive: true });
      }
      
      if (existsSync(manifestPath)) {
        copyFileSync(manifestPath, resolve(distPath, 'manifest.json'));
      }
      
      // Copy icons if they exist
      const iconsDir = resolve(__dirname, 'public/icons');
      const distIconsDir = resolve(distPath, 'icons');
      if (existsSync(iconsDir)) {
        if (!existsSync(distIconsDir)) {
          mkdirSync(distIconsDir, { recursive: true });
        }
        // Note: This is a simple implementation. For production, use a proper copy plugin.
      }
    },
  };
}

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'content/calendar': resolve(__dirname, 'src/content/calendar.ts'),
        'content/contact': resolve(__dirname, 'src/content/contact.ts'),
        'background/service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
  plugins: [copyManifest()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});

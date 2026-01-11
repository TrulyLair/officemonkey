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

// Plugin to inline all shared chunks into entry files
function inlineSharedChunks() {
  return {
    name: 'inline-shared-chunks',
    generateBundle(options: any, bundle: any) {
      const entryFiles = new Map<string, any>();
      const sharedChunks = new Map<string, any>();
      
      // Separate entry chunks from shared chunks
      Object.keys(bundle).forEach((fileName) => {
        const chunk = bundle[fileName];
        if (chunk.type === 'chunk') {
          if (chunk.isEntry) {
            entryFiles.set(fileName, chunk);
          } else {
            sharedChunks.set(fileName, chunk);
          }
        }
      });
      
      // Inline shared chunks into each entry that imports them
      entryFiles.forEach((entryChunk, entryFileName) => {
        sharedChunks.forEach((sharedChunk, sharedFileName) => {
          // Get the base name without path and extension
          const baseName = sharedFileName.replace(/\.js$/, '').replace(/^.*\//, '');
          // Check if entry imports this shared chunk - handle minified and non-minified
          // Pattern: from"../dom" or from '../dom.js' or from"../dom.js"
          const importPatterns = [
            new RegExp(`from["']\\.\\./${baseName}["']`, 'g'),
            new RegExp(`from["']\\.\\./${sharedFileName.replace(/\.js$/, '')}["']`, 'g'),
            new RegExp(`from["']\\.\\.?/${baseName}\\.js["']`, 'g'),
          ];
          
          const hasImport = importPatterns.some(pattern => pattern.test(entryChunk.code));
          
          if (hasImport) {
            // Extract the shared chunk code
            let inlinedCode = sharedChunk.code;
            
            // First, extract export mappings before removing exports
            // Pattern: export { a as i, r as l, s as w }
            const exportMap = new Map<string, string>();
            const exportMatch = inlinedCode.match(/export\s*\{([^}]+)\}/);
            if (exportMatch) {
              const exportList = exportMatch[1];
              // Parse "a as i, r as l, s as w"
              const exportPattern = /(\w+)\s+as\s+(\w+)/g;
              let expMatch;
              while ((expMatch = exportPattern.exec(exportList)) !== null) {
                const [, original, exported] = expMatch;
                exportMap.set(exported, original);
              }
            }
            
            // Now remove export statements
            inlinedCode = inlinedCode.replace(/export\s*\{([^}]+)\}\s*;?\s*$/gm, '');
            inlinedCode = inlinedCode.replace(/export\s*\{([^}]+)\}/g, '');
            inlinedCode = inlinedCode.replace(/export\s+default\s+/g, '');
            inlinedCode = inlinedCode.replace(/export\s+(const|let|var|function|class|async\s+function)\s+/g, '$1 ');
            inlinedCode = inlinedCode.replace(/\s+as\s+\w+\s*,?\s*;?\s*$/gm, '');
            
            // Find and replace all import statements for this chunk
            const importRegex = new RegExp(`import[\\s{]*([^"']+?)[\\s}]*from["']\\.\\.?/${baseName}(?:\\.js)?["'];?`, 'g');
            entryChunk.code = entryChunk.code.replace(importRegex, (match: string, importSpec: string) => {
              // Parse import spec to handle aliases like "i as S" or "{i as S, r as l}"
              let aliasCode = '';
              const aliasPattern = /(\w+)\s+as\s+(\w+)/g;
              let aliasMatch;
              
              // Extract all aliases from the import spec
              while ((aliasMatch = aliasPattern.exec(importSpec)) !== null) {
                const [, importedName, alias] = aliasMatch;
                // Look up what the imported name maps to in the export
                const actualName = exportMap.get(importedName) || importedName;
                // Create const alias = actualName;
                aliasCode += `const ${alias} = ${actualName};\n`;
              }
              
              // If there are aliases, add them after the inlined code
              if (aliasCode) {
                return inlinedCode + '\n' + aliasCode;
              }
              
              return inlinedCode;
            });
            
            // Also try without the .js extension
            const importRegex2 = new RegExp(`import[\\s{]*([^"']+?)[\\s}]*from["']\\.\\.?/${sharedFileName.replace(/\.js$/, '')}["'];?`, 'g');
            entryChunk.code = entryChunk.code.replace(importRegex2, (match: string, importSpec: string) => {
              let aliasCode = '';
              const aliasPattern = /(\w+)\s+as\s+(\w+)/g;
              let aliasMatch;
              
              while ((aliasMatch = aliasPattern.exec(importSpec)) !== null) {
                const [, importedName, alias] = aliasMatch;
                const actualName = exportMap.get(importedName) || importedName;
                aliasCode += `const ${alias} = ${actualName};\n`;
              }
              
              if (aliasCode) {
                return inlinedCode + '\n' + aliasCode;
              }
              
              return inlinedCode;
            });
            
            // Delete the shared chunk
            delete bundle[sharedFileName];
          }
        });
      });
    },
  };
}

// Build configuration for Chrome extension
// Using ES modules format and inlining all shared chunks into IIFE format
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
        format: 'es',
        // Don't split into chunks - put everything in entry files
        manualChunks: undefined,
      },
    },
  },
  plugins: [
    copyManifest(),
    inlineSharedChunks(),
    // Convert ES modules to IIFE after inlining
    {
      name: 'es-to-iife',
      generateBundle(options: any, bundle: any) {
        Object.keys(bundle).forEach((fileName) => {
          const chunk = bundle[fileName];
          if (chunk.type === 'chunk' && chunk.isEntry) {
            // Wrap in IIFE
            chunk.code = `(function() {\n${chunk.code}\n})();`;
          }
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});

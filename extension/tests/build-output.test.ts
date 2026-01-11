import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

describe('Build Output Tests', () => {
  const distPath = resolve(__dirname, '../dist');

  describe('Content Scripts', () => {
    it('should not contain broken typeof checks in calendar.js', () => {
      const calendarPath = resolve(distPath, 'content/calendar.js');
      expect(existsSync(calendarPath)).toBe(true);
      
      const content = readFileSync(calendarPath, 'utf-8');
      
      // Should not contain broken minified typeof checks
      // Bad: typeof x<"u" or typeof x>"u"
      expect(content).not.toMatch(/typeof\s+\w+\s*[<>]\s*["']u["']/);
      
      // Should use != null checks instead
      // Good: x!=null or x==null
      expect(content).toMatch(/!=null|==null/);
    });

    it('should not contain broken typeof checks in contact.js', () => {
      const contactPath = resolve(distPath, 'content/contact.js');
      expect(existsSync(contactPath)).toBe(true);
      
      const content = readFileSync(contactPath, 'utf-8');
      
      // Should not contain broken minified typeof checks
      expect(content).not.toMatch(/typeof\s+\w+\s*[<>]\s*["']u["']/);
    });

    it('should not contain import statements in calendar.js', () => {
      const calendarPath = resolve(distPath, 'content/calendar.js');
      const content = readFileSync(calendarPath, 'utf-8');
      
      // Should not have ES module import statements
      expect(content).not.toMatch(/^import\s+/m);
      expect(content).not.toMatch(/from\s+["']\.\./);
    });

    it('should not contain import statements in contact.js', () => {
      const contactPath = resolve(distPath, 'content/contact.js');
      const content = readFileSync(contactPath, 'utf-8');
      
      // Should not have ES module import statements
      expect(content).not.toMatch(/^import\s+/m);
      expect(content).not.toMatch(/from\s+["']\.\./);
    });

    it('should not contain export statements in calendar.js', () => {
      const calendarPath = resolve(distPath, 'content/calendar.js');
      const content = readFileSync(calendarPath, 'utf-8');
      
      // Should not have ES module export statements
      expect(content).not.toMatch(/^export\s+/m);
      expect(content).not.toMatch(/export\s*\{/);
    });

    it('should not contain export statements in contact.js', () => {
      const contactPath = resolve(distPath, 'content/contact.js');
      const content = readFileSync(contactPath, 'utf-8');
      
      // Should not have ES module export statements
      expect(content).not.toMatch(/^export\s+/m);
      expect(content).not.toMatch(/export\s*\{/);
    });

    it('should be wrapped in IIFE in calendar.js', () => {
      const calendarPath = resolve(distPath, 'content/calendar.js');
      const content = readFileSync(calendarPath, 'utf-8');
      
      // Should start with IIFE wrapper
      expect(content.trim()).toMatch(/^\(function\(\)\s*\{/);
      // Should end with IIFE wrapper
      expect(content.trim()).toMatch(/\}\)\(\);?\s*$/);
    });

    it('should be wrapped in IIFE in contact.js', () => {
      const contactPath = resolve(distPath, 'content/contact.js');
      const content = readFileSync(contactPath, 'utf-8');
      
      // Should start with IIFE wrapper
      expect(content.trim()).toMatch(/^\(function\(\)\s*\{/);
      // Should end with IIFE wrapper
      expect(content.trim()).toMatch(/\}\)\(\);?\s*$/);
    });

    it('should have proper jQuery checks in calendar.js', () => {
      const calendarPath = resolve(distPath, 'content/calendar.js');
      const content = readFileSync(calendarPath, 'utf-8');
      
      // Should use != null checks for jQuery
      expect(content).toMatch(/\.\$\s*!=\s*null/);
      expect(content).toMatch(/\.\$j\s*!=\s*null/);
      
      // Should not use broken typeof checks
      expect(content).not.toMatch(/typeof\s+.*\.\$\s*[<>]/);
      expect(content).not.toMatch(/typeof\s+.*\.\$j\s*[<>]/);
    });
  });

  describe('Manifest', () => {
    it('should have correct content script paths', () => {
      const manifestPath = resolve(distPath, 'manifest.json');
      expect(existsSync(manifestPath)).toBe(true);
      
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
      
      // Check calendar script
      const calendarScript = manifest.content_scripts.find(
        (cs: any) => cs.matches && cs.matches.some((m: string) => m.includes('ApptCal.php'))
      );
      expect(calendarScript).toBeDefined();
      expect(calendarScript.js).toContain('content/calendar.js');
      expect(calendarScript.js).not.toContain('src/');
      
      // Check contact script
      const contactScript = manifest.content_scripts.find(
        (cs: any) => cs.matches && cs.matches.some((m: string) => m.includes('safeoffice.com/*'))
      );
      expect(contactScript).toBeDefined();
      expect(contactScript.js).toContain('content/contact.js');
      expect(contactScript.js).not.toContain('src/');
    });

    it('should not have type: module in content scripts', () => {
      const manifestPath = resolve(distPath, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
      
      manifest.content_scripts.forEach((cs: any) => {
        // Should not have type: module since we're using IIFE
        expect(cs.type).not.toBe('module');
      });
    });
  });
});

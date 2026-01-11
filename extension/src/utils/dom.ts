/**
 * DOM manipulation utilities
 */

/**
 * Wait for an element to appear in the DOM
 */
export function waitForElement(
  selector: string,
  timeout: number = 5000,
  interval: number = 100
): Promise<Element | null> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const check = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      if (Date.now() - startTime >= timeout) {
        resolve(null);
        return;
      }
      
      setTimeout(check, interval);
    };
    
    check();
  });
}

/**
 * Wait for a function to return a truthy value
 */
export function waitForCondition(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<boolean> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const check = () => {
      if (condition()) {
        resolve(true);
        return;
      }
      
      if (Date.now() - startTime >= timeout) {
        resolve(false);
        return;
      }
      
      setTimeout(check, interval);
    };
    
    check();
  });
}

/**
 * Inject CSS into the page
 */
export function injectCSS(css: string): void {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

/**
 * Load external CSS file
 */
export function loadCSS(href: string): void {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = href;
  document.head.appendChild(link);
}

import { chromium } from 'playwright';
import { BrowserError, BrowserState, ScreenshotOptions, ElementInfo } from '../types/index.js';

class PlaywrightController {
  private state: BrowserState = {
    browser: null,
    context: null,
    page: null,
    debug: false
  };

  private currentMousePosition = { x: 0, y: 0 };

  // PHASE 1 FIX: Actually store console messages and network requests
  private consoleMessages: Array<{type: string, text: string, timestamp: Date}> = [];
  private networkRequests: Array<{
    url: string,
    method: string,
    status?: number,
    headers?: Record<string, string>,
    body?: string,
    timing?: any,
    timestamp: Date
  }> = [];

  private log(...args: any[]) {
    if (this.state.debug) {
      console.log(JSON.stringify({
        type: "debug",
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ')
      }));
    }
  }

  async openBrowser(headless: boolean = false, debug: boolean = false): Promise<void> {
    try {
      this.state.debug = debug;
      this.log('Attempting to launch browser');
      
      if (this.state.browser?.isConnected()) {
        this.log('Browser already running');
        return;
      }

      this.log('Launching new browser instance', { headless });
      this.state.browser = await chromium.launch({ 
        headless,
        args: ['--no-sandbox']
      });
      
      this.log('Creating browser context');
      this.state.context = await this.state.browser.newContext({
        viewport: { width: 1280, height: 720 }
      });
      
      this.log('Creating new page');
      this.state.page = await this.state.context.newPage();

      // PHASE 1 FIX: Set up console and network monitoring listeners
      this.state.page.on('console', msg => {
        this.consoleMessages.push({
          type: msg.type(),
          text: msg.text(),
          timestamp: new Date()
        });
      });

      this.state.page.on('request', request => {
        this.networkRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          timestamp: new Date()
        });
      });

      this.state.page.on('response', async response => {
        const req = this.networkRequests.find(r => r.url === response.url() && !r.status);
        if (req) {
          req.status = response.status();
          // Note: Playwright doesn't expose timing API directly on Response
          // Timing info would need to be collected via Performance API or browser contexts
          try {
            // Try to get response body (may fail for binary data)
            req.body = await response.text().catch(() => '[Binary or failed to load]');
          } catch {
            req.body = '[Failed to capture]';
          }
        }
      });

      this.log('Browser successfully launched with monitoring enabled');
    } catch (error: any) {
      console.error('Browser launch error:', error);
      throw new BrowserError(
        'Failed to launch browser', 
        `Technical details: ${error?.message || 'Unknown error'}`
      );
    }
  }

  async closeBrowser(): Promise<void> {
    try {
      this.log('Closing browser');
      await this.state.page?.close();
      await this.state.context?.close();
      await this.state.browser?.close();
      this.state = { browser: null, context: null, page: null, debug: false };
      this.log('Browser closed');
    } catch (error: any) {
      console.error('Browser close error:', error);
      throw new BrowserError('Failed to close browser', 'The browser might have already been closed');
    }
  }

  async navigate(url: string): Promise<void> {
    try {
      if (!this.isInitialized()) {
        throw new Error('Browser not initialized');
      }
      this.log('Navigating to', url);
      await this.state.page?.goto(url);
      this.log('Navigation complete');
    } catch (error: any) {
      console.error('Navigation error:', error);
      throw new BrowserError('Failed to navigate', 'Check if the URL is valid and accessible');
    }
  }

  async goBack(): Promise<void> {
    try {
      if (!this.isInitialized()) {
        throw new Error('Browser not initialized');
      }
      this.log('Going back');
      await this.state.page?.goBack();
      this.log('Navigation back complete');
    } catch (error: any) {
      console.error('Go back error:', error);
      throw new BrowserError('Failed to go back', 'Check if there is a previous page in history');
    }
  }

  async refresh(): Promise<void> {
    try {
      if (!this.isInitialized()) {
        throw new Error('Browser not initialized');
      }
      this.log('Refreshing page');
      await this.state.page?.reload();
      this.log('Page refresh complete');
    } catch (error: any) {
      console.error('Refresh error:', error);
      throw new BrowserError('Failed to refresh page', 'Check if the page is still accessible');
    }
  }

  async click(selector?: string): Promise<void> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      if (selector) {
        this.log('Clicking element', selector);
        await this.state.page.click(selector);
      } else {
        this.log('Clicking at position', this.currentMousePosition);
        await this.state.page.mouse.click(this.currentMousePosition.x, this.currentMousePosition.y);
      }
      this.log('Click complete');
    } catch (error: any) {
      console.error('Click error:', error);
      throw new BrowserError(
        'Failed to click',
        selector ? 'Check if the element exists and is visible' : 'Check if mouse position is valid'
      );
    }
  }

  async type(selector: string, text: string): Promise<void> {
    try {
      if (!this.isInitialized()) {
        throw new Error('Browser not initialized');
      }
      this.log('Typing into element', { selector, text });
      await this.state.page?.type(selector, text);
      this.log('Type complete');
    } catch (error: any) {
      console.error('Type error:', error);
      throw new BrowserError('Failed to type text', 'Check if the input element exists and is editable');
    }
  }

  async moveMouse(x: number, y: number): Promise<void> {
    try {
      if (!this.isInitialized()) {
        throw new Error('Browser not initialized');
      }
      this.log('Moving mouse to', { x, y });
      await this.state.page?.mouse.move(x, y);
      this.currentMousePosition = { x, y };
      this.log('Mouse move complete');
    } catch (error: any) {
      console.error('Mouse move error:', error);
      throw new BrowserError('Failed to move mouse', 'Check if coordinates are within viewport');
    }
  }

  async scroll(x: number, y: number, smooth: boolean = false): Promise<{before: {x: number, y: number}, after: {x: number, y: number}}> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      
      this.log('Scrolling', { x, y, smooth });
      
      // Get scroll position before scrolling
      const beforeScroll = await this.state.page.evaluate(() => ({
        x: window.scrollX,
        y: window.scrollY
      }));
      
      // Perform scroll with optional smooth behavior
      await this.state.page.evaluate((args: {x: number, y: number, smooth: boolean}) => {
        window.scrollBy({
          left: args.x,
          top: args.y,
          behavior: args.smooth ? 'smooth' : 'auto'
        });
      }, { x, y, smooth });
      
      // Wait for scroll to complete
      await this.state.page.waitForTimeout(smooth ? 500 : 100);
      
      // Get scroll position after scrolling
      const afterScroll = await this.state.page.evaluate(() => ({
        x: window.scrollX,
        y: window.scrollY
      }));
      
      this.log('Scroll complete', { before: beforeScroll, after: afterScroll });
      
      return {
        before: beforeScroll,
        after: afterScroll
      };
    } catch (error: any) {
      console.error('Scroll error:', error);
      throw new BrowserError('Failed to scroll', 'Check if scroll values are valid');
    }
  }

  async screenshot(options: ScreenshotOptions): Promise<void> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      this.log('Taking screenshot', options);
      
      if (options.type === 'element' && options.selector) {
        const element = await this.state.page.$(options.selector);
        if (!element) {
          throw new Error('Element not found');
        }
        await element.screenshot({ path: options.path });
      } else if (options.type === 'viewport') {
        await this.state.page.screenshot({ path: options.path });
      } else {
        await this.state.page.screenshot({ path: options.path, fullPage: true });
      }
      
      this.log('Screenshot saved to', options.path);
    } catch (error: any) {
      console.error('Screenshot error:', error);
      throw new BrowserError(
        'Failed to take screenshot',
        'Check if the path is writable and element exists (if capturing element)'
      );
    }
  }

  async inspectElement(selector: string): Promise<ElementInfo> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      this.log('Inspecting element', selector);
      const info = await this.state.page.$eval(selector, (el: Element) => ({
        tagName: el.tagName,
        className: el.className,
        id: el.id,
        attributes: Array.from(el.attributes).map(attr => ({
          name: attr.name,
          value: attr.value
        })),
        innerText: el.textContent
      }));
      this.log('Element inspection complete');
      return info;
    } catch (error: any) {
      console.error('Inspect element error:', error);
      throw new BrowserError('Failed to inspect element', 'Check if the element exists');
    }
  }

  async getPageSource(): Promise<string> {
    try {
      if (!this.isInitialized()) {
        throw new Error('Browser not initialized');
      }
      this.log('Getting page source');
      const content = await this.state.page?.content();
      this.log('Page source retrieved');
      return content || '';
    } catch (error: any) {
      console.error('Get page source error:', error);
      throw new BrowserError('Failed to get page source', 'Check if the page is loaded');
    }
  }

  async getPageText(): Promise<string> {
    try {
      if (!this.isInitialized()) {
        throw new Error('Browser not initialized');
      }
      this.log('Getting page text content');
      const text = await this.state.page?.innerText('body');
      this.log('Page text retrieved');
      return text || '';
    } catch (error: any) {
      console.error('Get page text error:', error);
      throw new BrowserError('Failed to get page text', 'Check if the page is loaded');
    }
  }

  async getPageTitle(): Promise<string> {
    try {
      if (!this.isInitialized()) {
        throw new Error('Browser not initialized');
      }
      this.log('Getting page title');
      const title = await this.state.page?.title();
      this.log('Page title retrieved:', title);
      return title || '';
    } catch (error: any) {
      console.error('Get page title error:', error);
      throw new BrowserError('Failed to get page title', 'Check if the page is loaded');
    }
  }

  async getPageUrl(): Promise<string> {
    try {
      if (!this.isInitialized()) {
        throw new Error('Browser not initialized');
      }
      this.log('Getting page URL');
      const url = this.state.page?.url();
      this.log('Page URL retrieved:', url);
      return url || '';
    } catch (error: any) {
      console.error('Get page URL error:', error);
      throw new BrowserError('Failed to get page URL', 'Check if the page is loaded');
    }
  }

  async getScripts(): Promise<string[]> {
    try {
      if (!this.isInitialized()) {
        throw new Error('Browser not initialized');
      }
      this.log('Getting page scripts');
      const scripts = await this.state.page?.evaluate(() => {
        const scriptElements = Array.from(document.querySelectorAll('script'));
        return scriptElements.map(script => {
          if (script.src) {
            return `// External script: ${script.src}`;
          }
          return script.textContent || script.innerHTML;
        }).filter(content => content.trim().length > 0);
      });
      this.log('Scripts retrieved:', scripts?.length);
      return scripts || [];
    } catch (error: any) {
      console.error('Get scripts error:', error);
      throw new BrowserError('Failed to get scripts', 'Check if the page is loaded');
    }
  }

  async getStylesheets(): Promise<string[]> {
    try {
      if (!this.isInitialized()) {
        throw new Error('Browser not initialized');
      }
      this.log('Getting page stylesheets');
      const stylesheets = await this.state.page?.evaluate(() => {
        const styleElements = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
        return styleElements.map(element => {
          if (element.tagName === 'LINK') {
            const link = element as HTMLLinkElement;
            return `/* External stylesheet: ${link.href} */`;
          }
          return element.textContent || element.innerHTML;
        }).filter(content => content.trim().length > 0);
      });
      this.log('Stylesheets retrieved:', stylesheets?.length);
      return stylesheets || [];
    } catch (error: any) {
      console.error('Get stylesheets error:', error);
      throw new BrowserError('Failed to get stylesheets', 'Check if the page is loaded');
    }
  }

  async getMetaTags(): Promise<Array<{name?: string, property?: string, content?: string, httpEquiv?: string}>> {
    try {
      if (!this.isInitialized()) {
        throw new Error('Browser not initialized');
      }
      this.log('Getting meta tags');
      const metaTags = await this.state.page?.evaluate(() => {
        const metaElements = Array.from(document.querySelectorAll('meta'));
        return metaElements.map(meta => ({
          name: meta.getAttribute('name') || undefined,
          property: meta.getAttribute('property') || undefined,
          content: meta.getAttribute('content') || undefined,
          httpEquiv: meta.getAttribute('http-equiv') || undefined
        }));
      });
      this.log('Meta tags retrieved:', metaTags?.length);
      return metaTags || [];
    } catch (error: any) {
      console.error('Get meta tags error:', error);
      throw new BrowserError('Failed to get meta tags', 'Check if the page is loaded');
    }
  }

  async getLinks(): Promise<Array<{href: string, text: string, title?: string}>> {
    try {
      if (!this.isInitialized()) {
        throw new Error('Browser not initialized');
      }
      this.log('Getting page links');
      const links = await this.state.page?.evaluate(() => {
        const linkElements = Array.from(document.querySelectorAll('a[href]'));
        return linkElements.map(link => ({
          href: (link as HTMLAnchorElement).href,
          text: link.textContent?.trim() || '',
          title: link.getAttribute('title') || undefined
        }));
      });
      this.log('Links retrieved:', links?.length);
      return links || [];
    } catch (error: any) {
      console.error('Get links error:', error);
      throw new BrowserError('Failed to get links', 'Check if the page is loaded');
    }
  }

  async getImages(): Promise<Array<{src: string, alt?: string, title?: string, width?: number, height?: number}>> {
    try {
      if (!this.isInitialized()) {
        throw new Error('Browser not initialized');
      }
      this.log('Getting page images');
      const images = await this.state.page?.evaluate(() => {
        const imgElements = Array.from(document.querySelectorAll('img'));
        return imgElements.map(img => ({
          src: (img as HTMLImageElement).src,
          alt: img.getAttribute('alt') || undefined,
          title: img.getAttribute('title') || undefined,
          width: (img as HTMLImageElement).naturalWidth || undefined,
          height: (img as HTMLImageElement).naturalHeight || undefined
        }));
      });
      this.log('Images retrieved:', images?.length);
      return images || [];
    } catch (error: any) {
      console.error('Get images error:', error);
      throw new BrowserError('Failed to get images', 'Check if the page is loaded');
    }
  }

  async getForms(): Promise<Array<{action?: string, method?: string, fields: Array<{name?: string, type?: string, value?: string}>}>> {
    try {
      if (!this.isInitialized()) {
        throw new Error('Browser not initialized');
      }
      this.log('Getting page forms');
      const forms = await this.state.page?.evaluate(() => {
        const formElements = Array.from(document.querySelectorAll('form'));
        return formElements.map(form => ({
          action: form.getAttribute('action') || undefined,
          method: form.getAttribute('method') || undefined,
          fields: Array.from(form.querySelectorAll('input, select, textarea')).map(field => ({
            name: field.getAttribute('name') || undefined,
            type: field.getAttribute('type') || field.tagName.toLowerCase(),
            value: (field as HTMLInputElement).value || undefined
          }))
        }));
      });
      this.log('Forms retrieved:', forms?.length);
      return forms || [];
    } catch (error: any) {
      console.error('Get forms error:', error);
      throw new BrowserError('Failed to get forms', 'Check if the page is loaded');
    }
  }

  async getElementContent(selector: string): Promise<{html: string, text: string}> {
    try {
      if (!this.isInitialized()) {
        throw new Error('Browser not initialized');
      }
      this.log('Getting element content for selector:', selector);
      const content = await this.state.page?.evaluate((sel) => {
        const element = document.querySelector(sel);
        if (!element) {
          throw new Error(`Element not found: ${sel}`);
        }
        return {
          html: element.innerHTML,
          text: element.textContent || ''
        };
      }, selector);
      this.log('Element content retrieved');
      return content || {html: '', text: ''};
    } catch (error: any) {
      console.error('Get element content error:', error);
      throw new BrowserError('Failed to get element content', 'Check if the element exists');
    }
  }

  async executeJavaScript(script: string): Promise<any> {
    try {
      if (!this.isInitialized()) {
        throw new Error('Browser not initialized');
      }
      this.log('Executing JavaScript:', script);
      const result = await this.state.page?.evaluate((scriptToExecute) => {
        // Create a function wrapper to handle different types of JavaScript code
        try {
          // If the script is an expression, return its value
          // If the script is statements, execute them and return undefined
          const wrappedScript = `
            (function() {
              ${scriptToExecute}
            })()
          `;
          return eval(wrappedScript);
        } catch (error) {
          // If wrapping fails, try executing directly
          return eval(scriptToExecute);
        }
      }, script);
      this.log('JavaScript execution completed:', result);
      return result;
    } catch (error: any) {
      console.error('Execute JavaScript error:', error);
      throw new BrowserError('Failed to execute JavaScript', 'Check if the JavaScript syntax is valid');
    }
  }

  async getElementHierarchy(
    selector: string = 'body', 
    maxDepth: number = 3, 
    includeText: boolean = false, 
    includeAttributes: boolean = false
  ): Promise<any> {
    try {
      if (!this.isInitialized()) {
        throw new Error('Browser not initialized');
      }
      
      this.log('Getting element hierarchy', { selector, maxDepth, includeText, includeAttributes });
      
      const hierarchy = await this.state.page?.evaluate((args: {
        selector: string, 
        maxDepth: number, 
        includeText: boolean, 
        includeAttributes: boolean
      }) => {
        const { selector, maxDepth, includeText, includeAttributes } = args;
        
        function getElementInfo(element: Element) {
          const info: any = {
            tagName: element.tagName.toLowerCase(),
            id: element.id || undefined,
            className: element.className || undefined,
            children: []
          };
          
          if (includeText && element.textContent) {
            // Get only direct text content, not from children
            const directText = Array.from(element.childNodes)
              .filter(node => node.nodeType === Node.TEXT_NODE)
              .map(node => node.textContent?.trim())
              .filter(text => text)
              .join(' ');
            if (directText) {
              info.text = directText;
            }
          }
          
          if (includeAttributes && element.attributes.length > 0) {
            info.attributes = {};
            for (let i = 0; i < element.attributes.length; i++) {
              const attr = element.attributes[i];
              if (attr.name !== 'id' && attr.name !== 'class') {
                info.attributes[attr.name] = attr.value;
              }
            }
          }
          
          return info;
        }
        
        function traverseElement(element: Element, currentDepth: number): any {
          const elementInfo = getElementInfo(element);
          
          if (currentDepth < maxDepth || maxDepth === -1) {
            const children = Array.from(element.children);
            elementInfo.children = children.map(child => 
              traverseElement(child, currentDepth + 1)
            );
          } else if (element.children.length > 0) {
            elementInfo.childrenCount = element.children.length;
          }
          
          return elementInfo;
        }
        
        const rootElement = document.querySelector(selector);
        if (!rootElement) {
          throw new Error(`Element not found: ${selector}`);
        }
        
        return traverseElement(rootElement, 0);
      }, { selector, maxDepth, includeText, includeAttributes });
      
      this.log('Element hierarchy retrieved');
      return hierarchy;
    } catch (error: any) {
      console.error('Get element hierarchy error:', error);
      throw new BrowserError('Failed to get element hierarchy', 'Check if the selector exists');
    }
  }

  // Additional navigation methods
  async goForward(): Promise<void> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      this.log('Going forward');
      await this.state.page.goForward();
      this.log('Forward navigation complete');
    } catch (error: any) {
      console.error('Go forward error:', error);
      throw new BrowserError('Failed to go forward', 'Check if there is a next page in history');
    }
  }

  // Enhanced interaction methods
  async hover(selector: string): Promise<void> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      this.log('Hovering over element', { selector });
      const locator = this.state.page.locator(selector);
      await locator.hover();
      this.log('Hover complete');
    } catch (error: any) {
      console.error('Hover error:', error);
      throw new BrowserError('Failed to hover over element', 'Check if the selector exists and is visible');
    }
  }

  async dragAndDrop(sourceSelector: string, targetSelector: string): Promise<void> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      this.log('Performing drag and drop', { sourceSelector, targetSelector });
      const sourceLocator = this.state.page.locator(sourceSelector);
      const targetLocator = this.state.page.locator(targetSelector);
      await sourceLocator.dragTo(targetLocator);
      this.log('Drag and drop complete');
    } catch (error: any) {
      console.error('Drag and drop error:', error);
      throw new BrowserError('Failed to drag and drop', 'Check if both selectors exist and are interactable');
    }
  }

  async selectOption(selector: string, values: string[]): Promise<void> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      this.log('Selecting options', { selector, values });
      const locator = this.state.page.locator(selector);
      await locator.selectOption(values);
      this.log('Select option complete');
    } catch (error: any) {
      console.error('Select option error:', error);
      throw new BrowserError('Failed to select option', 'Check if the selector exists and values are valid');
    }
  }

  async pressKey(key: string): Promise<void> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      this.log('Pressing key', { key });
      await this.state.page.keyboard.press(key);
      this.log('Key press complete');
    } catch (error: any) {
      console.error('Press key error:', error);
      throw new BrowserError('Failed to press key', 'Check if the key name is valid');
    }
  }

  async waitForText(text: string, timeout: number = 30000): Promise<void> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      this.log('Waiting for text', { text, timeout });
      await this.state.page.waitForSelector(`text=${text}`, { timeout });
      this.log('Text found');
    } catch (error: any) {
      console.error('Wait for text error:', error);
      throw new BrowserError('Text not found within timeout', 'Check if the text appears on the page');
    }
  }

  async waitForSelector(selector: string, timeout: number = 30000): Promise<void> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      this.log('Waiting for selector', { selector, timeout });
      await this.state.page.waitForSelector(selector, { timeout });
      this.log('Selector found');
    } catch (error: any) {
      console.error('Wait for selector error:', error);
      throw new BrowserError('Selector not found within timeout', 'Check if the selector appears on the page');
    }
  }

  async resize(width: number, height: number): Promise<void> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      this.log('Resizing viewport', { width, height });
      await this.state.page.setViewportSize({ width, height });
      this.log('Resize complete');
    } catch (error: any) {
      console.error('Resize error:', error);
      throw new BrowserError('Failed to resize viewport', 'Check if width and height are positive numbers');
    }
  }

  // Dialog handling
  async handleDialog(accept: boolean, promptText?: string): Promise<void> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      this.log('Setting up dialog handler', { accept, promptText });
      
      this.state.page.once('dialog', async dialog => {
        this.log('Dialog detected', { type: dialog.type(), message: dialog.message() });
        if (accept) {
          await dialog.accept(promptText);
        } else {
          await dialog.dismiss();
        }
        this.log('Dialog handled');
      });
    } catch (error: any) {
      console.error('Handle dialog error:', error);
      throw new BrowserError('Failed to handle dialog', 'Check if there is a dialog to handle');
    }
  }

  // Console and network methods
  async getConsoleMessages(): Promise<Array<{type: string, text: string, timestamp: Date}>> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      this.log('Getting console messages', { count: this.consoleMessages.length });

      // PHASE 1 FIX: Return actually collected messages
      return [...this.consoleMessages]; // Return copy to prevent external modification
    } catch (error: any) {
      console.error('Get console messages error:', error);
      throw new BrowserError('Failed to get console messages', 'Browser console monitoring error');
    }
  }

  async clearConsoleMessages(): Promise<void> {
    try {
      this.log('Clearing console messages');
      this.consoleMessages = [];
      this.log('Console messages cleared');
    } catch (error: any) {
      console.error('Clear console messages error:', error);
      throw new BrowserError('Failed to clear console messages', 'Error clearing console message buffer');
    }
  }

  async getNetworkRequests(): Promise<Array<{
    url: string,
    method: string,
    status?: number,
    headers?: Record<string, string>,
    body?: string,
    timing?: any,
    timestamp: Date
  }>> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      this.log('Getting network requests', { count: this.networkRequests.length });

      // PHASE 1 FIX: Return actually collected requests with full details
      return [...this.networkRequests]; // Return copy to prevent external modification;
    } catch (error: any) {
      console.error('Get network requests error:', error);
      throw new BrowserError('Failed to get network requests', 'Network monitoring error');
    }
  }

  async clearNetworkRequests(): Promise<void> {
    try {
      this.log('Clearing network requests');
      this.networkRequests = [];
      this.log('Network requests cleared');
    } catch (error: any) {
      console.error('Clear network requests error:', error);
      throw new BrowserError('Failed to clear network requests', 'Error clearing network request buffer');
    }
  }

  async uploadFiles(selector: string, filePaths: string[]): Promise<void> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      this.log('Uploading files', { selector, filePaths });
      const locator = this.state.page.locator(selector);
      await locator.setInputFiles(filePaths);
      this.log('File upload complete');
    } catch (error: any) {
      console.error('File upload error:', error);
      throw new BrowserError('Failed to upload files', 'Check if selector is a file input and files exist');
    }
  }

  async evaluateWithReturn(script: string): Promise<any> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      this.log('Evaluating JavaScript with return', { script });
      const result = await this.state.page.evaluate(script);
      this.log('JavaScript evaluation complete');
      return result;
    } catch (error: any) {
      console.error('JavaScript evaluation error:', error);
      throw new BrowserError('Failed to evaluate JavaScript', 'Check if the script is valid JavaScript');
    }
  }

  // Enhanced screenshot functionality
  async takeScreenshot(path: string, options?: {fullPage?: boolean, element?: string}): Promise<void> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      this.log('Taking screenshot', { path, options });
      
      if (options?.element) {
        const locator = this.state.page.locator(options.element);
        await locator.screenshot({ path });
      } else {
        await this.state.page.screenshot({ path, fullPage: options?.fullPage });
      }
      
      this.log('Screenshot saved');
    } catch (error: any) {
      console.error('Screenshot error:', error);
      throw new BrowserError('Failed to take screenshot', 'Check if the path is writable');
    }
  }

  // Mouse coordinate methods
  async mouseMove(x: number, y: number): Promise<void> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      this.log('Moving mouse', { x, y });
      await this.state.page.mouse.move(x, y);
      this.currentMousePosition = { x, y };
      this.log('Mouse move complete');
    } catch (error: any) {
      console.error('Mouse move error:', error);
      throw new BrowserError('Failed to move mouse', 'Check if coordinates are valid');
    }
  }

  async mouseClick(x: number, y: number): Promise<void> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      this.log('Clicking at coordinates', { x, y });
      await this.state.page.mouse.click(x, y);
      this.currentMousePosition = { x, y };
      this.log('Mouse click complete');
    } catch (error: any) {
      console.error('Mouse click error:', error);
      throw new BrowserError('Failed to click at coordinates', 'Check if coordinates are valid');
    }
  }

  async mouseDrag(startX: number, startY: number, endX: number, endY: number): Promise<void> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      this.log('Mouse drag', { startX, startY, endX, endY });
      await this.state.page.mouse.move(startX, startY);
      await this.state.page.mouse.down();
      await this.state.page.mouse.move(endX, endY);
      await this.state.page.mouse.up();
      this.currentMousePosition = { x: endX, y: endY };
      this.log('Mouse drag complete');
    } catch (error: any) {
      console.error('Mouse drag error:', error);
      throw new BrowserError('Failed to drag mouse', 'Check if coordinates are valid');
    }
  }

  // ===========================================
  // PHASE 2: NETWORK INTERCEPTION & MOCKING
  // ===========================================

  async interceptRequest(urlPattern: string | RegExp, action: 'abort' | 'continue' | 'mock', mockResponse?: any): Promise<void> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      this.log('Setting up request interception', { urlPattern, action });

      await this.state.page.route(urlPattern, async route => {
        if (action === 'abort') {
          await route.abort();
        } else if (action === 'mock' && mockResponse) {
          await route.fulfill({
            status: mockResponse.status || 200,
            contentType: mockResponse.contentType || 'application/json',
            body: typeof mockResponse.body === 'string' ? mockResponse.body : JSON.stringify(mockResponse.body)
          });
        } else {
          await route.continue();
        }
      });

      this.log('Request interception set up successfully');
    } catch (error: any) {
      console.error('Request interception error:', error);
      throw new BrowserError('Failed to set up request interception', error.message);
    }
  }

  async mockApiResponse(url: string, mockData: any, status: number = 200): Promise<void> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      this.log('Mocking API response', { url, status });

      await this.state.page.route(url, route => {
        route.fulfill({
          status,
          contentType: 'application/json',
          body: JSON.stringify(mockData)
        });
      });

      this.log('API response mocked successfully');
    } catch (error: any) {
      console.error('Mock API response error:', error);
      throw new BrowserError('Failed to mock API response', error.message);
    }
  }

  async blockResources(resourceTypes: string[]): Promise<void> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      this.log('Blocking resource types', { resourceTypes });

      await this.state.page.route('**/*', route => {
        const type = route.request().resourceType();
        if (resourceTypes.includes(type)) {
          route.abort();
        } else {
          route.continue();
        }
      });

      this.log('Resource blocking set up successfully');
    } catch (error: any) {
      console.error('Block resources error:', error);
      throw new BrowserError('Failed to block resources', error.message);
    }
  }

  // ===========================================
  // PHASE 3: COOKIE & STORAGE MANAGEMENT
  // ===========================================

  async getCookies(name?: string): Promise<any[]> {
    try {
      if (!this.isInitialized() || !this.state.context) {
        throw new Error('Browser not initialized');
      }
      this.log('Getting cookies', { name });

      const cookies = await this.state.context.cookies();

      if (name) {
        return cookies.filter(c => c.name === name);
      }

      return cookies;
    } catch (error: any) {
      console.error('Get cookies error:', error);
      throw new BrowserError('Failed to get cookies', error.message);
    }
  }

  async setCookie(cookie: {name: string, value: string, domain?: string, path?: string, expires?: number}): Promise<void> {
    try {
      if (!this.isInitialized() || !this.state.context) {
        throw new Error('Browser not initialized');
      }
      this.log('Setting cookie', { name: cookie.name });

      await this.state.context.addCookies([{
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain || this.state.page?.url().split('/')[2] || 'localhost',
        path: cookie.path || '/',
        expires: cookie.expires || Date.now() + 86400000 // Default 1 day
      }]);

      this.log('Cookie set successfully');
    } catch (error: any) {
      console.error('Set cookie error:', error);
      throw new BrowserError('Failed to set cookie', error.message);
    }
  }

  async clearCookies(): Promise<void> {
    try {
      if (!this.isInitialized() || !this.state.context) {
        throw new Error('Browser not initialized');
      }
      this.log('Clearing all cookies');

      await this.state.context.clearCookies();

      this.log('Cookies cleared successfully');
    } catch (error: any) {
      console.error('Clear cookies error:', error);
      throw new BrowserError('Failed to clear cookies', error.message);
    }
  }

  async getLocalStorage(key?: string): Promise<any> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      this.log('Getting localStorage', { key });

      const result = await this.state.page.evaluate((k) => {
        if (k) {
          return localStorage.getItem(k);
        }
        return JSON.stringify(localStorage);
      }, key);

      return key ? result : JSON.parse(result || '{}');
    } catch (error: any) {
      console.error('Get localStorage error:', error);
      throw new BrowserError('Failed to get localStorage', error.message);
    }
  }

  async setLocalStorage(key: string, value: string): Promise<void> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      this.log('Setting localStorage', { key });

      await this.state.page.evaluate(([k, v]) => {
        localStorage.setItem(k, v);
      }, [key, value]);

      this.log('localStorage set successfully');
    } catch (error: any) {
      console.error('Set localStorage error:', error);
      throw new BrowserError('Failed to set localStorage', error.message);
    }
  }

  async clearLocalStorage(): Promise<void> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      this.log('Clearing localStorage');

      await this.state.page.evaluate(() => {
        localStorage.clear();
      });

      this.log('localStorage cleared successfully');
    } catch (error: any) {
      console.error('Clear localStorage error:', error);
      throw new BrowserError('Failed to clear localStorage', error.message);
    }
  }

  // ===========================================
  // PHASE 4: HTTP SERVER SUPPORT METHODS
  // ===========================================

  /**
   * Take screenshot and return as Buffer (for HTTP responses)
   */
  async screenshotBuffer(options?: {fullPage?: boolean, type?: 'png' | 'jpeg'}): Promise<Buffer> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      this.log('Taking screenshot as buffer', options);

      const buffer = await this.state.page.screenshot({
        fullPage: options?.fullPage !== false,
        type: options?.type || 'png'
      });

      this.log('Screenshot buffer created');
      return buffer;
    } catch (error: any) {
      console.error('Screenshot buffer error:', error);
      throw new BrowserError('Failed to take screenshot', error.message);
    }
  }

  /**
   * Check if element is visible on page
   */
  async isElementVisible(selector: string): Promise<boolean> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      this.log('Checking element visibility', { selector });

      const isVisible = await this.state.page.isVisible(selector);

      this.log('Element visibility check complete', { isVisible });
      return isVisible;
    } catch (error: any) {
      console.error('Element visibility check error:', error);
      return false; // Return false instead of throwing for visibility checks
    }
  }

  /**
   * Fill form field (alias for type method)
   */
  async fill(selector: string, text: string): Promise<void> {
    return this.type(selector, text);
  }

  /**
   * Wait for specified milliseconds
   */
  async waitFor(ms: number): Promise<void> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }
      this.log('Waiting for', { ms });

      await this.state.page.waitForTimeout(ms);

      this.log('Wait complete');
    } catch (error: any) {
      console.error('Wait error:', error);
      throw new BrowserError('Failed to wait', error.message);
    }
  }

  /**
   * Get direct access to Playwright Page object for advanced operations
   * Use sparingly - prefer wrapped methods when available
   */
  getPage() {
    if (!this.isInitialized() || !this.state.page) {
      throw new Error('Browser not initialized');
    }
    return this.state.page;
  }

  // ===========================================
  // PHASE 5: GEMINI VISION ANALYSIS
  // ===========================================

  /**
   * Analyze screenshot with Gemini Vision
   * @param imageBuffer - Screenshot buffer (PNG or JPEG)
   * @param prompt - Analysis prompt (optional, defaults to general description)
   * @param apiKey - Gemini API key (required)
   */
  async analyzeImageWithGemini(imageBuffer: Buffer, prompt?: string, apiKey?: string): Promise<string> {
    try {
      if (!apiKey) {
        throw new Error('Gemini API key is required');
      }

      this.log('Analyzing image with Gemini Vision', {
        promptLength: prompt?.length || 0,
        imageSize: imageBuffer.length
      });

      // Dynamic import of Gemini SDK
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');

      // Determine image MIME type from buffer
      let mimeType = 'image/png';
      if (imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8) {
        mimeType = 'image/jpeg';
      }

      // Default prompt if not provided
      const analysisPrompt = prompt ||
        'Describe this screenshot in detail. Include any visible text, UI elements, layout, and notable features.';

      // Generate content with vision
      const result = await model.generateContent([
        analysisPrompt,
        {
          inlineData: {
            data: base64Image,
            mimeType
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();

      this.log('Gemini Vision analysis complete', { responseLength: text.length });
      return text;

    } catch (error: any) {
      console.error('Gemini Vision error:', error);
      throw new BrowserError('Failed to analyze image with Gemini Vision', error.message);
    }
  }

  /**
   * Take screenshot and analyze with Gemini Vision
   * @param url - URL to screenshot (optional, uses current page if not provided)
   * @param prompt - Analysis prompt
   * @param apiKey - Gemini API key
   * @param screenshotOptions - Screenshot options (fullPage, type)
   */
  async analyzeScreenshot(
    url?: string,
    prompt?: string,
    apiKey?: string,
    screenshotOptions?: { fullPage?: boolean; type?: 'png' | 'jpeg' }
  ): Promise<{ analysis: string; screenshot: string; url: string; title: string }> {
    try {
      if (!this.isInitialized() || !this.state.page) {
        throw new Error('Browser not initialized');
      }

      if (!apiKey) {
        throw new Error('Gemini API key is required');
      }

      this.log('Taking screenshot for Gemini analysis', { url, prompt: prompt?.substring(0, 50) });

      // Navigate if URL provided
      if (url) {
        await this.navigate(url);
      }

      // Take screenshot
      const screenshot = await this.screenshotBuffer(screenshotOptions);

      // Get page metadata
      const pageUrl = await this.getPageUrl();
      const title = await this.getPageTitle();

      // Analyze with Gemini
      const analysis = await this.analyzeImageWithGemini(screenshot, prompt, apiKey);

      return {
        analysis,
        screenshot: screenshot.toString('base64'),
        url: pageUrl,
        title
      };

    } catch (error: any) {
      console.error('Screenshot analysis error:', error);
      throw new BrowserError('Failed to analyze screenshot', error.message);
    }
  }

  isInitialized(): boolean {
    return !!(this.state.browser?.isConnected() && this.state.context && this.state.page);
  }
}

export const playwrightController = new PlaywrightController();
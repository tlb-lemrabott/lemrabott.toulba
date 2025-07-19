interface LogLevel {
  DEBUG: 0;
  INFO: 1;
  WARN: 2;
  ERROR: 3;
  NONE: 4;
}

class Logger {
  private static instance: Logger;
  private logLevel: number;
  private isDevelopment: boolean;

  private constructor() {
    // Detect environment
    this.isDevelopment = this.detectEnvironment();
    
    // Set log level based on environment
    this.logLevel = this.isDevelopment ? 0 : 3; // DEBUG in dev, ERROR only in prod
    
    // Override with URL parameter if present (for debugging)
    const urlParams = new URLSearchParams(window.location.search);
    const debugLevel = urlParams.get('debug');
    if (debugLevel) {
      this.logLevel = parseInt(debugLevel) || 0;
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private detectEnvironment(): boolean {
    // Check if we're running locally
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('dev');
    
    // Check for development indicators
    const hasDevIndicator = window.location.search.includes('dev=true') ||
                           window.location.search.includes('debug=true');
    
    // Check if Hugo is in development mode (if available)
    const isHugoDev = typeof window !== 'undefined' && 
                     (window as any).__HUGO_ENV === 'development';
    
    return isLocalhost || hasDevIndicator || isHugoDev;
  }

  public debug(...args: any[]): void {
    if (this.logLevel <= 0) {
      console.log('[DEBUG]', ...args);
    }
  }

  public info(...args: any[]): void {
    if (this.logLevel <= 1) {
      console.info('[INFO]', ...args);
    }
  }

  public warn(...args: any[]): void {
    if (this.logLevel <= 2) {
      console.warn('[WARN]', ...args);
    }
  }

  public error(...args: any[]): void {
    if (this.logLevel <= 3) {
      console.error('[ERROR]', ...args);
    }
  }

  public group(label: string): void {
    if (this.logLevel <= 0) {
      console.group(label);
    }
  }

  public groupEnd(): void {
    if (this.logLevel <= 0) {
      console.groupEnd();
    }
  }

  public getEnvironment(): string {
    return this.isDevelopment ? 'development' : 'production';
  }

  public isDev(): boolean {
    return this.isDevelopment;
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Convenience functions
export const debug = (...args: any[]) => logger.debug(...args);
export const info = (...args: any[]) => logger.info(...args);
export const warn = (...args: any[]) => logger.warn(...args);
export const error = (...args: any[]) => logger.error(...args);
export const group = (label: string) => logger.group(label);
export const groupEnd = () => logger.groupEnd(); 
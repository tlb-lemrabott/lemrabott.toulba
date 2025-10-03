interface LogLevel {
  DEBUG: 0;
  INFO: 1;
  WARN: 2;
  ERROR: 3;
  NONE: 4;
}

class BackendLogger {
  private static instance: BackendLogger;
  private logLevel: number;
  private isDevelopment: boolean;

  private constructor() {
    // Detect environment
    this.isDevelopment = this.detectEnvironment();
    
    // Set log level based on environment
    this.logLevel = this.isDevelopment ? 0 : 3; // DEBUG in dev, ERROR only in prod
    
    // Override with environment variable if present
    const envLogLevel = process.env.LOG_LEVEL;
    if (envLogLevel) {
      this.logLevel = parseInt(envLogLevel) || 3;
    }
  }

  public static getInstance(): BackendLogger {
    if (!BackendLogger.instance) {
      BackendLogger.instance = new BackendLogger();
    }
    return BackendLogger.instance;
  }

  private detectEnvironment(): boolean {
    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === 'development' || 
                 process.env.NODE_ENV === 'dev' ||
                 (process.env.AWS_LAMBDA_FUNCTION_NAME?.includes('dev') ?? false) ||
                 (process.env.AWS_LAMBDA_FUNCTION_NAME?.includes('test') ?? false);
    
    return isDev;
  }

  public debug(...args: any[]): void {
    if (this.logLevel <= 0) {
      console.log('[DEBUG]', new Date().toISOString(), ...args);
    }
  }

  public info(...args: any[]): void {
    if (this.logLevel <= 1) {
      console.info('[INFO]', new Date().toISOString(), ...args);
    }
  }

  public warn(...args: any[]): void {
    if (this.logLevel <= 2) {
      console.warn('[WARN]', new Date().toISOString(), ...args);
    }
  }

  public error(...args: any[]): void {
    if (this.logLevel <= 3) {
      console.error('[ERROR]', new Date().toISOString(), ...args);
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
export const logger = BackendLogger.getInstance();

// Convenience functions
export const debug = (...args: any[]) => logger.debug(...args);
export const info = (...args: any[]) => logger.info(...args);
export const warn = (...args: any[]) => logger.warn(...args);
export const error = (...args: any[]) => logger.error(...args);
export const group = (label: string) => logger.group(label);
export const groupEnd = () => logger.groupEnd();

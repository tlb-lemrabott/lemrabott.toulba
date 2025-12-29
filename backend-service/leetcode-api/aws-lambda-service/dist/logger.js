"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupEnd = exports.group = exports.error = exports.warn = exports.info = exports.debug = exports.logger = void 0;
class BackendLogger {
    constructor() {
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
    static getInstance() {
        if (!BackendLogger.instance) {
            BackendLogger.instance = new BackendLogger();
        }
        return BackendLogger.instance;
    }
    detectEnvironment() {
        var _a, _b, _c, _d;
        // Check if we're in development mode
        const isDev = process.env.NODE_ENV === 'development' ||
            process.env.NODE_ENV === 'dev' ||
            ((_b = (_a = process.env.AWS_LAMBDA_FUNCTION_NAME) === null || _a === void 0 ? void 0 : _a.includes('dev')) !== null && _b !== void 0 ? _b : false) ||
            ((_d = (_c = process.env.AWS_LAMBDA_FUNCTION_NAME) === null || _c === void 0 ? void 0 : _c.includes('test')) !== null && _d !== void 0 ? _d : false);
        return isDev;
    }
    debug(...args) {
        if (this.logLevel <= 0) {
            console.log('[DEBUG]', new Date().toISOString(), ...args);
        }
    }
    info(...args) {
        if (this.logLevel <= 1) {
            console.info('[INFO]', new Date().toISOString(), ...args);
        }
    }
    warn(...args) {
        if (this.logLevel <= 2) {
            console.warn('[WARN]', new Date().toISOString(), ...args);
        }
    }
    error(...args) {
        if (this.logLevel <= 3) {
            console.error('[ERROR]', new Date().toISOString(), ...args);
        }
    }
    group(label) {
        if (this.logLevel <= 0) {
            console.group(label);
        }
    }
    groupEnd() {
        if (this.logLevel <= 0) {
            console.groupEnd();
        }
    }
    getEnvironment() {
        return this.isDevelopment ? 'development' : 'production';
    }
    isDev() {
        return this.isDevelopment;
    }
}
// Export singleton instance
exports.logger = BackendLogger.getInstance();
// Convenience functions
const debug = (...args) => exports.logger.debug(...args);
exports.debug = debug;
const info = (...args) => exports.logger.info(...args);
exports.info = info;
const warn = (...args) => exports.logger.warn(...args);
exports.warn = warn;
const error = (...args) => exports.logger.error(...args);
exports.error = error;
const group = (label) => exports.logger.group(label);
exports.group = group;
const groupEnd = () => exports.logger.groupEnd();
exports.groupEnd = groupEnd;

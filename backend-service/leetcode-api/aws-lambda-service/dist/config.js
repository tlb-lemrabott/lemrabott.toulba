"use strict";
// Configuration for the LeetCode API service
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCorsOptions = exports.isOriginAllowed = exports.config = void 0;
// Environment-based configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
exports.config = {
    cors: {
        allowedOrigins: [
            // Production domains
            'https://www.lemrabotttoulba.com',
            'https://lemrabotttoulba.com',
            // Development domains
            'http://localhost:1313', // Hugo development server
            'http://localhost:3000', // Common development port
            'http://localhost:8080', // Alternative development port
            'http://127.0.0.1:1313', // Alternative localhost
            'http://127.0.0.1:3000',
            'http://127.0.0.1:8080',
            // Add more development origins if needed
            ...(isDevelopment ? [
                'http://localhost:4000',
                'http://localhost:5000',
                'http://127.0.0.1:4000',
                'http://127.0.0.1:5000'
            ] : [])
        ],
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'Accept',
            'Origin'
        ],
        optionsSuccessStatus: 200
    },
    rateLimit: {
        strict: {
            windowMs: 60 * 60 * 1000, // 1 hour
            max: isProduction ? 10 : 100 // More lenient in development
        },
        standard: {
            windowMs: 60 * 60 * 1000, // 1 hour
            max: isProduction ? 100 : 1000 // More lenient in development
        }
    },
    cache: {
        defaultTTL: 30 * 60 * 1000, // 30 minutes
        maxSize: 100
    },
    api: {
        timeout: 15000, // 15 seconds
        retries: 3
    }
};
// Helper function to check if origin is allowed
const isOriginAllowed = (origin) => {
    if (!origin)
        return true; // Allow requests with no origin
    return exports.config.cors.allowedOrigins.includes(origin);
};
exports.isOriginAllowed = isOriginAllowed;
// Helper function to get CORS options
const getCorsOptions = () => ({
    origin: function (origin, callback) {
        if ((0, exports.isOriginAllowed)(origin)) {
            callback(null, true);
        }
        else {
            console.warn(`CORS blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: exports.config.cors.credentials,
    methods: exports.config.cors.methods,
    allowedHeaders: exports.config.cors.allowedHeaders,
    optionsSuccessStatus: exports.config.cors.optionsSuccessStatus
});
exports.getCorsOptions = getCorsOptions;

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const service_1 = require("./service");
const config_1 = require("./config");
const logger_1 = require("./logger");
const app = (0, express_1.default)();
// Configure CORS with centralized configuration
app.use((0, cors_1.default)((0, config_1.getCorsOptions)()));
// Enhanced logging middleware
app.use((req, res, next) => {
    (0, logger_1.debug)(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin || 'No origin'}`);
    next();
});
// Handle CORS preflight requests
app.options('*', (0, cors_1.default)((0, config_1.getCorsOptions)()));
// Enhanced rate limiter with different limits for different endpoints
const strictLimiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.config.rateLimit.strict.windowMs,
    max: config_1.config.rateLimit.strict.max,
    keyGenerator: (req) => req.ip || "unknown",
    handler: (req, res) => {
        res.status(429).json({
            error: "Too many requests from this IP, try again in 1 hour",
        });
    },
    skipFailedRequests: true,
});
const standardLimiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.config.rateLimit.standard.windowMs,
    max: config_1.config.rateLimit.standard.max,
    keyGenerator: (req) => req.ip || "unknown",
    handler: (req, res) => {
        res.status(429).json({
            error: "Too many requests from this IP, try again in 1 hour",
        });
    },
    skipFailedRequests: true,
});
// Health check endpoint
app.get("/api/v1/health", standardLimiter, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const health = yield (0, service_1.healthCheck)();
        res.status(200).json(Object.assign({ service_status: "healthy", timestamp: new Date().toISOString() }, health));
    }
    catch (error) {
        res.status(500).json({
            service_status: "unhealthy",
            error: "Health check failed"
        });
    }
}));
// Cache pre-warming endpoint (for internal use)
app.post("/api/v1/prewarm", standardLimiter, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, service_1.prewarmCache)();
        res.status(200).json({
            message: "Cache pre-warmed successfully",
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to pre-warm cache"
        });
    }
}));
// Main LeetCode stats endpoint with enhanced error handling
app.get("/api/v1/leetcode/:username", strictLimiter, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username } = req.params;
    // Input validation
    if (!username || username.trim().length === 0) {
        res.status(400).json({
            error: "Username is required",
            response_code: 400
        });
        return;
    }
    try {
        const startTime = Date.now();
        const stats = yield (0, service_1.fetchLeetCodeData)(username);
        const responseTime = Date.now() - startTime;
        res.status(200).json({
            response_code: 200,
            username: username,
            leetcode_data: stats,
            response_time_ms: responseTime,
            timestamp: new Date().toISOString()
        });
    }
    catch (err) {
        const errorObj = err;
        (0, logger_1.error)("Error fetching user:", errorObj.message);
        // More specific error responses with better cold start handling
        if (errorObj.message.includes("Invalid or missing user data")) {
            res.status(404).json({
                error: "User not found or profile is private",
                response_code: 404
            });
        }
        else if (errorObj.message.includes("Max retries exceeded") || errorObj.message.includes("timeout")) {
            // Likely a cold start or network issue
            (0, logger_1.debug)("Detected potential cold start issue, attempting retry...");
            res.status(503).json({
                error: "Service temporarily unavailable, please try again",
                response_code: 503,
                retry_after: 5
            });
        }
        else {
            res.status(500).json({
                error: "Internal server error",
                response_code: 500
            });
        }
    }
}));
exports.default = app;

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduledWarmup = exports.warmup = void 0;
const service_1 = require("./service");
const logger_1 = require("./logger");
// Enhanced warm-up function to keep Lambda container alive
const warmup = (event, context) => __awaiter(void 0, void 0, void 0, function* () {
    (0, logger_1.debug)('Enhanced warm-up function triggered');
    try {
        // Pre-warm the cache with main user data
        yield (0, service_1.prewarmCache)();
        // Also warm up with a few other common usernames if needed
        const commonUsernames = ['vRCcb0Nnvp']; // Add more if needed
        for (const username of commonUsernames) {
            try {
                yield (0, service_1.fetchLeetCodeData)(username);
                (0, logger_1.debug)(`Warmed up cache for user: ${username}`);
            }
            catch (err) {
                (0, logger_1.error)(`Failed to warm up for user ${username}:`, err);
                // Continue with other usernames even if one fails
            }
        }
        // Additional warm-up: make sure the client is fully initialized
        try {
            const { getLeetCodeClient } = yield Promise.resolve().then(() => __importStar(require('./service')));
            getLeetCodeClient();
            (0, logger_1.debug)('LeetCode client warmed up successfully');
        }
        catch (err) {
            (0, logger_1.error)('Failed to warm up LeetCode client:', err);
        }
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Enhanced warm-up completed successfully',
                timestamp: new Date().toISOString(),
                cache_size: 'warmed'
            })
        };
    }
    catch (err) {
        (0, logger_1.error)('Enhanced warm-up failed:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Enhanced warm-up failed',
                message: err instanceof Error ? err.message : 'Unknown error'
            })
        };
    }
});
exports.warmup = warmup;
// CloudWatch Events trigger function
const scheduledWarmup = (event, context) => __awaiter(void 0, void 0, void 0, function* () {
    (0, logger_1.debug)('Scheduled warm-up triggered');
    return yield (0, exports.warmup)(event, context);
});
exports.scheduledWarmup = scheduledWarmup;

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
exports.handler = void 0;
const serverless_express_1 = __importDefault(require("@vendia/serverless-express"));
const app_1 = __importDefault(require("./app"));
const service_1 = require("./service");
const logger_1 = require("./logger");
// Global variable to track if we've initialized
let isInitialized = false;
let initializationPromise = null;
// Initialize function for cold starts (non-blocking)
const initialize = () => __awaiter(void 0, void 0, void 0, function* () {
    if (isInitialized)
        return;
    if (initializationPromise)
        return initializationPromise;
    initializationPromise = (() => __awaiter(void 0, void 0, void 0, function* () {
        (0, logger_1.debug)("Cold start detected - initializing...");
        try {
            // Pre-warm the cache during cold start
            yield (0, service_1.prewarmCache)();
            (0, logger_1.debug)("Cold start initialization completed successfully");
            isInitialized = true;
        }
        catch (err) {
            (0, logger_1.error)("Cold start initialization failed:", err);
            // Don't throw here - let the app continue
        }
    }))();
    return initializationPromise;
});
// Create serverless express handler once (outside handler function for reuse)
// This handler supports both REST API and HTTP API (v1 and v2) events
const serverlessHandler = (0, serverless_express_1.default)({
    app: app_1.default,
    resolutionMode: 'CALLBACK',
    respondWithErrors: false
});
// Main Lambda handler with proper HTTP API v2 support
const handler = (event, context) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Log event details for debugging
    const eventVersion = event.version || ((_a = event.requestContext) === null || _a === void 0 ? void 0 : _a.version) || 'unknown';
    const rawPath = event.rawPath || event.path || 'unknown';
    const pathParameters = event.pathParameters || {};
    (0, logger_1.debug)(`Lambda invoked - Event version: ${eventVersion}, Path: ${rawPath}, Params:`, pathParameters);
    // Start initialization in background (non-blocking)
    // Don't await - let it run in parallel with the request
    initialize().catch((err) => {
        (0, logger_1.error)("Background initialization error:", err);
    });
    try {
        // Invoke serverless express handler with callback pattern
        // Wrap callback in Promise for async/await compatibility
        const result = yield new Promise((resolve, reject) => {
            serverlessHandler(event, context, (error, response) => {
                if (error) {
                    reject(typeof error === 'string' ? new Error(error) : error);
                }
                else if (response) {
                    resolve(response);
                }
                else {
                    reject(new Error('Handler returned undefined response'));
                }
            });
        });
        // Ensure we always return a valid response
        if (!result) {
            (0, logger_1.error)("Handler returned undefined/null response");
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    error: 'Internal server error',
                    message: 'Handler did not return a response'
                })
            };
        }
        // Log successful response
        (0, logger_1.debug)(`Request completed successfully - Status: ${result.statusCode}`);
        return result;
    }
    catch (err) {
        const errorObj = err;
        (0, logger_1.error)("Handler error:", errorObj.message, errorObj.stack);
        // Return proper error response
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: errorObj.message || 'Unknown error occurred'
            })
        };
    }
});
exports.handler = handler;

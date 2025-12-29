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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeetCodeClient = void 0;
exports.fetchLeetCodeData = fetchLeetCodeData;
exports.prewarmCache = prewarmCache;
exports.healthCheck = healthCheck;
const leetcode_query_1 = require("leetcode-query");
const logger_1 = require("./logger");
// Enhanced cache with better memory management
class LeetCodeCache {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 1000 * 60 * 30; // 30 minutes default
        this.maxCacheSize = 100; // Prevent memory leaks
    }
    set(key, data, ttl = this.defaultTTL) {
        // Clean up old entries if cache is full
        if (this.cache.size >= this.maxCacheSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }
        this.cache.set(key, {
            timestamp: Date.now(),
            data,
            ttl
        });
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    clear() {
        this.cache.clear();
    }
    getCacheSize() {
        return this.cache.size;
    }
}
// Singleton cache instance
const cache = new LeetCodeCache();
// LeetCode client with connection reuse and cold start handling
let leetcodeClient = null;
let clientInitialized = false;
const getLeetCodeClient = () => {
    if (!leetcodeClient) {
        (0, logger_1.debug)("Initializing LeetCode client...");
        leetcodeClient = new leetcode_query_1.LeetCode();
        clientInitialized = true;
        (0, logger_1.debug)("LeetCode client initialized successfully");
    }
    return leetcodeClient;
};
exports.getLeetCodeClient = getLeetCodeClient;
// Initialize client early to avoid cold start delays
const initializeClient = () => {
    if (!clientInitialized) {
        (0, exports.getLeetCodeClient)();
    }
};
// Enhanced error handling with retry logic for cold starts
const fetchWithRetry = (fn_1, ...args_1) => __awaiter(void 0, [fn_1, ...args_1], void 0, function* (fn, retries = 5) {
    for (let i = 0; i < retries; i++) {
        try {
            return yield fn();
        }
        catch (error) {
            (0, logger_1.debug)(`Retry attempt ${i + 1}/${retries} failed:`, error);
            if (i === retries - 1)
                throw error;
            // Enhanced backoff strategy for cold starts
            let delay;
            if (i === 0) {
                // First retry after 1 second (cold start detection)
                delay = 1000;
            }
            else if (i === 1) {
                // Second retry after 2 seconds
                delay = 2000;
            }
            else {
                // Exponential backoff for subsequent retries
                delay = Math.pow(2, i) * 1000;
            }
            (0, logger_1.debug)(`Waiting ${delay}ms before retry ${i + 2}...`);
            yield new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error('Max retries exceeded');
});
function fetchLeetCodeData(username) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check cache first
        const cached = cache.get(username);
        if (cached) {
            (0, logger_1.debug)(`Cache hit for user: ${username}`);
            return cached;
        }
        (0, logger_1.debug)(`Cache miss for user: ${username}, fetching from LeetCode API`);
        try {
            const data = yield fetchWithRetry(() => __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c, _d, _e;
                // Ensure client is initialized
                initializeClient();
                const leetcode = (0, exports.getLeetCodeClient)();
                const user = yield leetcode.user(username);
                const matchedUser = user === null || user === void 0 ? void 0 : user.matchedUser;
                if (!matchedUser || !matchedUser.submitStats || !matchedUser.profile) {
                    throw new Error("Invalid or missing user data.");
                }
                const stats = matchedUser.submitStats.acSubmissionNum;
                const totalSolved = ((_a = stats.find(s => s.difficulty === "All")) === null || _a === void 0 ? void 0 : _a.count) || 0;
                const totalSubmissions = ((_b = stats.find(s => s.difficulty === "All")) === null || _b === void 0 ? void 0 : _b.submissions) || 0;
                const leetCodeData = {
                    totalSolved,
                    easySolved: ((_c = stats.find(s => s.difficulty === "Easy")) === null || _c === void 0 ? void 0 : _c.count) || 0,
                    mediumSolved: ((_d = stats.find(s => s.difficulty === "Medium")) === null || _d === void 0 ? void 0 : _d.count) || 0,
                    hardSolved: ((_e = stats.find(s => s.difficulty === "Hard")) === null || _e === void 0 ? void 0 : _e.count) || 0,
                    ranking: matchedUser.profile.ranking || 0,
                    totalSubmissions: stats.map(entry => {
                        var _a;
                        return ({
                            difficulty: entry.difficulty,
                            count: entry.count,
                            submissions: (_a = entry.submissions) !== null && _a !== void 0 ? _a : 0,
                        });
                    }),
                    totalSubmissionCount: totalSubmissions,
                    acceptanceRate: totalSubmissions > 0 ? parseFloat(((totalSolved / totalSubmissions) * 100).toFixed(1)) : 0,
                };
                return leetCodeData;
            }));
            // Cache the result with shorter TTL for frequently accessed data
            const ttl = username === "vRCcb0Nnvp" ? 1000 * 60 * 15 : 1000 * 60 * 30; // 15 min for main user, 30 min for others
            cache.set(username, data, ttl);
            return data;
        }
        catch (error) {
            console.error(`Error fetching LeetCode data for ${username}:`, error);
            throw error;
        }
    });
}
// Pre-warm cache function for main user
function prewarmCache() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            (0, logger_1.debug)("Starting cache pre-warming...");
            // Initialize client first
            initializeClient();
            yield fetchLeetCodeData("vRCcb0Nnvp");
            (0, logger_1.debug)("Cache pre-warmed successfully");
        }
        catch (err) {
            (0, logger_1.error)("Failed to pre-warm cache:", err);
            // Don't throw - this is a best-effort operation
        }
    });
}
// Health check function
function healthCheck() {
    return __awaiter(this, void 0, void 0, function* () {
        return {
            status: "healthy",
            cacheSize: cache.getCacheSize()
        };
    });
}

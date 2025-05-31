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
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => req.ip || "unknown",
    handler: (req, res) => {
        res.status(429).json({
            error: "Too many requests from this IP, try again in 1 hour",
        });
    },
    skipFailedRequests: true,
});
app.get("/api/v1/leetcode/:username", limiter, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username } = req.params;
    try {
        const stats = yield (0, service_1.fetchLeetCodeData)(username);
        res.status(200).json({
            response_code: 200,
            username: username,
            leetcode_data: stats,
        });
    }
    catch (error) {
        const err = error;
        console.error("Error fetching user:", err.message);
        res.status(404).json({ error: "User invalid" });
    }
}));
exports.default = app;

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
exports.fetchLeetCodeData = fetchLeetCodeData;
const leetcode_query_1 = require("leetcode-query");
let cache = {};
const TTL = 1000 * 60 * 60; // 1 hour
function fetchLeetCodeData(username) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const now = Date.now();
        const cached = cache[username];
        if (cached && now - cached.timestamp < TTL) {
            return cached.data;
        }
        const leetcode = new leetcode_query_1.LeetCode();
        const user = yield leetcode.user(username);
        const matchedUser = user === null || user === void 0 ? void 0 : user.matchedUser;
        if (!matchedUser || !matchedUser.submitStats || !matchedUser.profile) {
            throw new Error("Invalid or missing user data.");
        }
        const stats = matchedUser.submitStats.acSubmissionNum;
        const totalSolved = ((_a = stats.find(s => s.difficulty === "All")) === null || _a === void 0 ? void 0 : _a.count) || 0;
        const totalSubmissions = ((_b = stats.find(s => s.difficulty === "All")) === null || _b === void 0 ? void 0 : _b.submissions) || 0;
        const data = {
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
        cache[username] = { timestamp: now, data };
        return data;
    });
}

import { LeetCode } from "leetcode-query";

interface SubmissionStats {
  difficulty: string;
  count: number;
  submissions: number;
}

interface LeetCodeData {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number;
  totalSubmissions: SubmissionStats[];
  totalSubmissionCount: number;
  acceptanceRate: number;
}

let cache: Record<string, { timestamp: number; data: LeetCodeData }> = {};
const TTL = 1000 * 60 * 60; // 1 hour

export async function fetchLeetCodeData(username: string): Promise<LeetCodeData> {
  const now = Date.now();
  const cached = cache[username];

  if (cached && now - cached.timestamp < TTL) {
    return cached.data;
  }

  const leetcode = new LeetCode();
  const user = await leetcode.user(username);

  const matchedUser = user?.matchedUser;
  if (!matchedUser || !matchedUser.submitStats || !matchedUser.profile) {
    throw new Error("Invalid or missing user data.");
  }

  const stats = matchedUser.submitStats.acSubmissionNum;

  const totalSolved = stats.find(s => s.difficulty === "All")?.count || 0;
  const totalSubmissions = stats.find(s => s.difficulty === "All")?.submissions || 0;

  const data: LeetCodeData = {
    totalSolved,
    easySolved: stats.find(s => s.difficulty === "Easy")?.count || 0,
    mediumSolved: stats.find(s => s.difficulty === "Medium")?.count || 0,
    hardSolved: stats.find(s => s.difficulty === "Hard")?.count || 0,
    ranking: matchedUser.profile.ranking || 0,
    totalSubmissions: stats.map(entry => ({
      difficulty: entry.difficulty,
      count: entry.count,
      submissions: entry.submissions ?? 0,
    })),
    totalSubmissionCount: totalSubmissions,
    acceptanceRate: totalSubmissions > 0 ? parseFloat(((totalSolved / totalSubmissions) * 100).toFixed(1)) : 0,
  };

  cache[username] = { timestamp: now, data };
  return data;
}
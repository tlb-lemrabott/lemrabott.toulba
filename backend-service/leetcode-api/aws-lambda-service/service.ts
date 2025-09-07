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

// Enhanced cache with better memory management
class LeetCodeCache {
  private cache: Map<string, { timestamp: number; data: LeetCodeData; ttl: number }> = new Map();
  private readonly defaultTTL = 1000 * 60 * 30; // 30 minutes default
  private readonly maxCacheSize = 100; // Prevent memory leaks

  set(key: string, data: LeetCodeData, ttl: number = this.defaultTTL): void {
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

  get(key: string): LeetCodeData | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

// Singleton cache instance
const cache = new LeetCodeCache();

// LeetCode client with connection reuse and cold start handling
let leetcodeClient: LeetCode | null = null;
let clientInitialized = false;

const getLeetCodeClient = (): LeetCode => {
  if (!leetcodeClient) {
    console.log("Initializing LeetCode client...");
    leetcodeClient = new LeetCode();
    clientInitialized = true;
    console.log("LeetCode client initialized successfully");
  }
  return leetcodeClient;
};

// Initialize client early to avoid cold start delays
const initializeClient = (): void => {
  if (!clientInitialized) {
    getLeetCodeClient();
  }
};

// Enhanced error handling with retry logic
const fetchWithRetry = async <T>(fn: () => Promise<T>, retries: number = 3): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      
      // Exponential backoff
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
};

export async function fetchLeetCodeData(username: string): Promise<LeetCodeData> {
  // Check cache first
  const cached = cache.get(username);
  if (cached) {
    console.log(`Cache hit for user: ${username}`);
    return cached;
  }

  console.log(`Cache miss for user: ${username}, fetching from LeetCode API`);

  try {
    const data = await fetchWithRetry(async () => {
      // Ensure client is initialized
      initializeClient();
      const leetcode = getLeetCodeClient();
      const user = await leetcode.user(username);

      const matchedUser = user?.matchedUser;
      if (!matchedUser || !matchedUser.submitStats || !matchedUser.profile) {
        throw new Error("Invalid or missing user data.");
      }

      const stats = matchedUser.submitStats.acSubmissionNum;

      const totalSolved = stats.find(s => s.difficulty === "All")?.count || 0;
      const totalSubmissions = stats.find(s => s.difficulty === "All")?.submissions || 0;

      const leetCodeData: LeetCodeData = {
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

      return leetCodeData;
    });

    // Cache the result with shorter TTL for frequently accessed data
    const ttl = username === "vRCcb0Nnvp" ? 1000 * 60 * 15 : 1000 * 60 * 30; // 15 min for main user, 30 min for others
    cache.set(username, data, ttl);

    return data;
  } catch (error) {
    console.error(`Error fetching LeetCode data for ${username}:`, error);
    throw error;
  }
}

// Pre-warm cache function for main user
export async function prewarmCache(): Promise<void> {
  try {
    console.log("Starting cache pre-warming...");
    // Initialize client first
    initializeClient();
    await fetchLeetCodeData("vRCcb0Nnvp");
    console.log("Cache pre-warmed successfully");
  } catch (error) {
    console.error("Failed to pre-warm cache:", error);
    // Don't throw - this is a best-effort operation
  }
}

// Health check function
export async function healthCheck(): Promise<{ status: string; cacheSize: number }> {
  return {
    status: "healthy",
    cacheSize: cache.getCacheSize()
  };
}
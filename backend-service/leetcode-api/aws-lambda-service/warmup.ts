import { fetchLeetCodeData, prewarmCache } from "./service";
import { debug, info, warn, error } from "./logger";

// Enhanced warm-up function to keep Lambda container alive
export const warmup = async (event: any, context: any) => {
  debug('Enhanced warm-up function triggered');
  
  try {
    // Pre-warm the cache with main user data
    await prewarmCache();
    
    // Also warm up with a few other common usernames if needed
    const commonUsernames = ['vRCcb0Nnvp']; // Add more if needed
    
    for (const username of commonUsernames) {
      try {
        await fetchLeetCodeData(username);
        debug(`Warmed up cache for user: ${username}`);
      } catch (err) {
        error(`Failed to warm up for user ${username}:`, err);
        // Continue with other usernames even if one fails
      }
    }
    
    // Additional warm-up: make sure the client is fully initialized
    try {
      const { getLeetCodeClient } = await import('./service');
      getLeetCodeClient();
      debug('LeetCode client warmed up successfully');
    } catch (err) {
      error('Failed to warm up LeetCode client:', err);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Enhanced warm-up completed successfully',
        timestamp: new Date().toISOString(),
        cache_size: 'warmed'
      })
    };
  } catch (err) {
    error('Enhanced warm-up failed:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Enhanced warm-up failed',
        message: err instanceof Error ? err.message : 'Unknown error'
      })
    };
  }
};

// CloudWatch Events trigger function
export const scheduledWarmup = async (event: any, context: any) => {
  debug('Scheduled warm-up triggered');
  return await warmup(event, context);
}; 
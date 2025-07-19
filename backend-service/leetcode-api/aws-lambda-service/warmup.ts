import { fetchLeetCodeData, prewarmCache } from "./service";

// Warm-up function to keep Lambda container alive
export const warmup = async (event: any, context: any) => {
  console.log('Warm-up function triggered');
  
  try {
    // Pre-warm the cache with main user data
    await prewarmCache();
    
    // Also warm up with a few other common usernames if needed
    const commonUsernames = ['vRCcb0Nnvp']; // Add more if needed
    
    for (const username of commonUsernames) {
      try {
        await fetchLeetCodeData(username);
        console.log(`Warmed up cache for user: ${username}`);
      } catch (error) {
        console.error(`Failed to warm up for user ${username}:`, error);
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Warm-up completed successfully',
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Warm-up failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Warm-up failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

// CloudWatch Events trigger function
export const scheduledWarmup = async (event: any, context: any) => {
  console.log('Scheduled warm-up triggered');
  return await warmup(event, context);
}; 
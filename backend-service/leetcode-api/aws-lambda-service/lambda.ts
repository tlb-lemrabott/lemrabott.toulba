import serverlessExpress from "@vendia/serverless-express";
import app from "./app";
import { prewarmCache } from "./service";
import { debug, info, warn, error } from "./logger";

// Global variable to track if we've initialized
let isInitialized = false;

// Initialize function for cold starts
const initialize = async () => {
  if (isInitialized) return;
  
  debug("Cold start detected - initializing...");
  try {
    // Pre-warm the cache during cold start
    await prewarmCache();
    debug("Cold start initialization completed successfully");
    isInitialized = true;
  } catch (err) {
    error("Cold start initialization failed:", err);
    // Don't throw here - let the app continue
  }
};

// Enhanced handler with cold start initialization
export const handler = serverlessExpress({ 
  app,
  resolutionMode: 'CALLBACK',
  respondWithErrors: false
});

// Initialize on module load for cold starts
initialize().catch(console.error);

// Additional cold start optimization
let coldStartHandled = false;

// Enhanced initialization for better cold start handling
const enhancedInitialize = async () => {
  if (coldStartHandled) return;
  
  debug("Enhanced cold start initialization...");
  try {
    // Pre-warm the cache during cold start
    await prewarmCache();
    
    // Additional initialization to ensure client is ready
    const { getLeetCodeClient } = await import('./service');
    getLeetCodeClient(); // Force client initialization
    
    debug("Enhanced cold start initialization completed");
    coldStartHandled = true;
  } catch (err) {
    error("Enhanced cold start initialization failed:", err);
    // Don't throw here - let the app continue
  }
};

// Call enhanced initialization
enhancedInitialize().catch(console.error);


// import type { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from "aws-lambda";
// import awsServerlessExpress from "aws-serverless-express";
// import app from "./app";

// const server = awsServerlessExpress.createServer(app);

// export const handler = (
//   event: APIGatewayProxyEvent,
//   context: Context
// ): Promise<APIGatewayProxyResult> => {
//   return awsServerlessExpress.proxy(server, event, context, "PROMISE").promise;
// };

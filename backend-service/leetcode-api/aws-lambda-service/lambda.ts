import serverlessExpress from "@vendia/serverless-express";
import app from "./app";
import { prewarmCache } from "./service";

// Global variable to track if we've initialized
let isInitialized = false;

// Initialize function for cold starts
const initialize = async () => {
  if (isInitialized) return;
  
  console.log("Cold start detected - initializing...");
  try {
    // Pre-warm the cache during cold start
    await prewarmCache();
    console.log("Cold start initialization completed successfully");
    isInitialized = true;
  } catch (error) {
    console.error("Cold start initialization failed:", error);
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

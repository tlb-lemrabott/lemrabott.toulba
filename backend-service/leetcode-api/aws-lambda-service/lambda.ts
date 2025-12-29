import serverlessExpress from "@vendia/serverless-express";
import type { APIGatewayProxyEvent, APIGatewayProxyEventV2, Context, APIGatewayProxyResult } from "aws-lambda";
import app from "./app";
import { prewarmCache } from "./service";
import { debug, info, warn, error } from "./logger";

// Global variable to track if we've initialized
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

// Initialize function for cold starts (non-blocking)
const initialize = async (): Promise<void> => {
  if (isInitialized) return;
  if (initializationPromise) return initializationPromise;
  
  initializationPromise = (async () => {
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
  })();
  
  return initializationPromise;
};

// Create serverless express handler once (outside handler function for reuse)
// This handler supports both REST API and HTTP API (v1 and v2) events
const serverlessHandler = serverlessExpress({ 
  app,
  resolutionMode: 'CALLBACK',
  respondWithErrors: false
});

// Main Lambda handler with proper HTTP API v2 support
export const handler = async (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Log event details for debugging
  const eventVersion = (event as any).version || (event as any).requestContext?.version || 'unknown';
  const rawPath = (event as any).rawPath || (event as any).path || 'unknown';
  const pathParameters = (event as any).pathParameters || {};
  
  debug(`Lambda invoked - Event version: ${eventVersion}, Path: ${rawPath}, Params:`, pathParameters);
  
  // Start initialization in background (non-blocking)
  // Don't await - let it run in parallel with the request
  initialize().catch((err) => {
    error("Background initialization error:", err);
  });
  
  try {
    // Invoke serverless express handler with callback pattern
    // Wrap callback in Promise for async/await compatibility
    const result = await new Promise<APIGatewayProxyResult>((resolve, reject) => {
      serverlessHandler(event, context, (error: string | Error | null | undefined, response?: APIGatewayProxyResult) => {
        if (error) {
          reject(typeof error === 'string' ? new Error(error) : error);
        } else if (response) {
          resolve(response);
        } else {
          reject(new Error('Handler returned undefined response'));
        }
      });
    });
    
    // Ensure we always return a valid response
    if (!result) {
      error("Handler returned undefined/null response");
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
    debug(`Request completed successfully - Status: ${result.statusCode}`);
    
    return result;
  } catch (err) {
    const errorObj = err as Error;
    error("Handler error:", errorObj.message, errorObj.stack);
    
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
};

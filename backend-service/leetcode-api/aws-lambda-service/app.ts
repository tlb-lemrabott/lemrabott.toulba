import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { fetchLeetCodeData, prewarmCache, healthCheck } from "./service";
import { config, getCorsOptions } from "./config";

const app = express();

// Configure CORS with centralized configuration
app.use(cors(getCorsOptions()));

// Enhanced logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin || 'No origin'}`);
  next();
});

// Handle CORS preflight requests
app.options('*', cors(getCorsOptions()));

// Enhanced rate limiter with different limits for different endpoints
const strictLimiter = rateLimit({
  windowMs: config.rateLimit.strict.windowMs,
  max: config.rateLimit.strict.max,
  keyGenerator: (req) => req.ip || "unknown",
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many requests from this IP, try again in 1 hour",
    });
  },
  skipFailedRequests: true,
});

const standardLimiter = rateLimit({
  windowMs: config.rateLimit.standard.windowMs,
  max: config.rateLimit.standard.max,
  keyGenerator: (req) => req.ip || "unknown",
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many requests from this IP, try again in 1 hour",
    });
  },
  skipFailedRequests: true,
});

// Health check endpoint
app.get("/api/v1/health", standardLimiter, async (req, res) => {
  try {
    const health = await healthCheck();
    res.status(200).json({
      service_status: "healthy",
      timestamp: new Date().toISOString(),
      ...health
    });
  } catch (error) {
    res.status(500).json({
      service_status: "unhealthy",
      error: "Health check failed"
    });
  }
});

// Cache pre-warming endpoint (for internal use)
app.post("/api/v1/prewarm", standardLimiter, async (req, res) => {
  try {
    await prewarmCache();
    res.status(200).json({
      message: "Cache pre-warmed successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to pre-warm cache"
    });
  }
});

// Main LeetCode stats endpoint with enhanced error handling
app.get("/api/v1/leetcode/:username", strictLimiter, async (req, res) => {
  const { username } = req.params;

  // Input validation
  if (!username || username.trim().length === 0) {
    res.status(400).json({ 
      error: "Username is required",
      response_code: 400
    });
    return;
  }

  try {
    const startTime = Date.now();
    const stats = await fetchLeetCodeData(username);
    const responseTime = Date.now() - startTime;

    res.status(200).json({
      response_code: 200,
      username: username,
      leetcode_data: stats,
      response_time_ms: responseTime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const err = error as Error;
    console.error("Error fetching user:", err.message);
    
    // More specific error responses with better cold start handling
    if (err.message.includes("Invalid or missing user data")) {
      res.status(404).json({ 
        error: "User not found or profile is private",
        response_code: 404
      });
    } else if (err.message.includes("Max retries exceeded") || err.message.includes("timeout")) {
      // Likely a cold start or network issue
      console.log("Detected potential cold start issue, attempting retry...");
      res.status(503).json({ 
        error: "Service temporarily unavailable, please try again",
        response_code: 503,
        retry_after: 5
      });
    } else {
      res.status(500).json({ 
        error: "Internal server error",
        response_code: 500
      });
    }
  }
});

export default app;

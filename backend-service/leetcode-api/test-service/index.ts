import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { fetchLeetCodeData } from "./service";

const app = express();
const PORT = 3001;

// Enable CORS for all origins (adjust as needed)
app.use(cors());

// Rate limiter: max 10 successful requests per IP per hour
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 10,
  keyGenerator: (req) => req.ip, // limit by IP
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many requests from this IP, try again in 1 hour",
    });
  },
  skipFailedRequests: true, // Only count successful requests (status < 400)
});

app.get("/api/leetcode/:username", limiter, async (req, res) => {
  const { username } = req.params;

  try {
    const stats = await fetchLeetCodeData(username);
    res.status(200).json({
      response_code: 200,
      username: username,
      leetcode_data: stats,
    });
  } catch (error) {
    const err = error as Error;
    console.error("Error fetching user:", err.message);
    res.status(404).json({ error: "User invalid" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { fetchLeetCodeData } from "./service";

const app = express();

//app.use(cors());

//midleware handle api gateway staging
const prodStage = process.env.API_PROD_STAGE ?? "prod";
const devStage = process.env.API_DEV_STAGE ?? "dev";
app.use((req, res, next) => {
  if (req.url.startsWith(`/${prodStage}`)) {
    req.url = req.url.slice(prodStage.length + 1) || "/";
  } else if (req.url.startsWith(`/${devStage}`)) {
    req.url = req.url.slice(devStage.length + 1) || "/";
  }
  next();
});

// const limiter = rateLimit({
//   windowMs: 60 * 60 * 1000,
//   max: 10,
//   keyGenerator: (req) => req.ip || "unknown",
//   handler: (req, res) => {
//     res.status(429).json({
//       error: "Too many requests from this IP, try again in 1 hour",
//     });
//   },
//   skipFailedRequests: true,
// });

app.get("/", (req, res) => {
  res.send("Hello from Lambda!");
});

app.get("/api/v1/leetcode/:username", async (req, res) => {
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

export default app;

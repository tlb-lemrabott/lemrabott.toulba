import { CountUp } from "countup.js";
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

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
  acceptanceRate: number
}

const CACHE_KEY = "leetcode_cache";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

const animate = (id: string, value: number): void => {
  const el = document.getElementById(id);
  if (el) {
    const countUp = new CountUp(id, value);
    countUp.start();
  }
};

const renderSubmissionChart = (submissions: SubmissionStats[]) => {
  const ctx = (document.getElementById("submissionChart") as HTMLCanvasElement)?.getContext("2d");

  if (!ctx) return;

  // Filter out 'All' difficulty if present
  const filtered = submissions.filter(s => s.difficulty !== "All");

  const labels = filtered.map(s => s.difficulty);
  const data = filtered.map(s => s.submissions);

  new Chart(ctx, {
    type: "bar", // or "pie"
    data: {
      labels: labels,
      datasets: [{
        label: "Submissions",
        data: data,
        backgroundColor: ["#4CAF50", "#2196F3", "#F44336"], // Easy, Medium, Hard
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Submissions per Difficulty"
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
};


const fetchLeetCodeStats = async () => {
  const now = Date.now();

  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const parsed = JSON.parse(cached);
    const { timestamp, data } = parsed;

    if (now - timestamp < CACHE_TTL) {
      console.log("Using cached LeetCode data");
      renderFromData(data);
      return;
    }
  }

  try {
    const response = await fetch("http://localhost:3001/api/leetcode/vRCcb0Nnvp");
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const json = await response.json();
    const data: LeetCodeData = json.leetcode_data;

    // Cache it
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: now,
      data
    }));

    renderFromData(data);
  } catch (error) {
    console.error("Error fetching LeetCode stats:", error);

    // Fallback to cache if available
    if (cached) {
      const parsed = JSON.parse(cached);
      renderFromData(parsed.data);
    }
  }
};

const renderFromData = (data: LeetCodeData) => {
  animate("totalSolved", data.totalSolved);
  animate("easySolved", data.easySolved);
  animate("mediumSolved", data.mediumSolved);
  animate("hardSolved", data.hardSolved);
  animate("totalSubmissions", data.totalSubmissions[0].submissions);
  animate("ranking", data.ranking);
  animate("acceptanceRate", data.acceptanceRate);
  renderSubmissionChart(data.totalSubmissions);
};


setInterval(async () => {
  try {
    const response = await fetch("http://localhost:3001/api/leetcode/vRCcb0Nnvp");
    if (!response.ok) return;

    const json = await response.json();
    const newData: LeetCodeData = json.leetcode_data;

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data: oldData } = JSON.parse(cached);

      if (JSON.stringify(newData) !== JSON.stringify(oldData)) {
        console.log("Data changed, updating cache");
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          timestamp: Date.now(),
          data: newData
        }));
      }
    }
  } catch (err) {
    console.log("Background update failed:", err);
  }
}, CACHE_TTL); 


// Run after DOM loads
document.addEventListener("DOMContentLoaded", fetchLeetCodeStats);
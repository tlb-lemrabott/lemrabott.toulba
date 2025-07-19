import { CountUp } from "countup.js";
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// Import cookie consent manager
import { cookieConsent } from './cookieConsent';

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

interface CacheEntry {
  timestamp: number;
  data: LeetCodeData;
  version: string;
}

const CACHE_KEY = "leetcode_cache_v2";
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const API_URL = "https://82ci0zfx68.execute-api.us-east-1.amazonaws.com/api/v1/leetcode/";
const USERNAME = "vRCcb0Nnvp";
const CACHE_VERSION = "1.0.0";

// Loading state management
let isLoading = false;
let loadingTimeout: NodeJS.Timeout | null = null;

// Show loading state
const showLoading = () => {
  if (isLoading) return;
  
  isLoading = true;
  
  // Show loading indicators
  const elements = ['totalSolved', 'easySolved', 'mediumSolved', 'hardSolved', 'totalSubmissions', 'ranking', 'acceptanceRate'];
  elements.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = '<span class="loading-dots">...</span>';
      el.classList.add('loading');
    }
  });

  // Set timeout for loading state
  loadingTimeout = setTimeout(() => {
    if (isLoading) {
      console.log("Loading timeout reached");
    }
  }, 10000);
};

// Hide loading state
const hideLoading = () => {
  isLoading = false;
  
  if (loadingTimeout) {
    clearTimeout(loadingTimeout);
    loadingTimeout = null;
  }

  // Remove loading indicators
  const elements = ['totalSolved', 'easySolved', 'mediumSolved', 'hardSolved', 'totalSubmissions', 'ranking', 'acceptanceRate'];
  elements.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('loading');
    }
  });
};

// Enhanced cache management with cookie consent
const getCachedData = (): LeetCodeData | null => {
  // Check if user has consented to cookies
  if (!cookieConsent.canUseCookies()) {
    console.log('Cookie consent not given, skipping cache');
    return null;
  }

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsed: CacheEntry = JSON.parse(cached);
    
    // Check version compatibility
    if (parsed.version !== CACHE_VERSION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    // Check TTL
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.error('Error reading cache:', error);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

const setCachedData = (data: LeetCodeData): void => {
  // Check if user has consented to cookies
  if (!cookieConsent.canUseCookies()) {
    console.log('Cookie consent not given, skipping cache write');
    return;
  }

  try {
    const cacheEntry: CacheEntry = {
      timestamp: Date.now(),
      data,
      version: CACHE_VERSION
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
  } catch (error) {
    console.error('Error writing cache:', error);
  }
};

// Simplified animation - just set the value directly
const setValue = (id: string, value: number): void => {
  const el = document.getElementById(id);
  if (!el) return;
  
  // Format the number with commas
  el.textContent = value.toLocaleString();
};

// Enhanced chart rendering with proper error handling
const renderSubmissionChart = (submissions: SubmissionStats[]) => {
  try {
    const canvas = document.getElementById("submissionChart") as HTMLCanvasElement;
    if (!canvas) {
      console.log('Chart canvas not found');
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.log('Could not get canvas context');
      return;
    }

    // Destroy existing chart if it exists
    if ((canvas as any)._chart) {
      try {
        (canvas as any)._chart.destroy();
      } catch (e) {
        console.log('Error destroying existing chart:', e);
      }
    }

    // Filter out 'All' difficulty if present
    const filtered = submissions.filter(s => s.difficulty !== "All");
    
    if (filtered.length === 0) {
      console.log('No submission data to display');
      return;
    }

    const labels = filtered.map(s => s.difficulty);
    const data = filtered.map(s => s.submissions);

    // Create chart with error handling
    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Submissions",
          data: data,
          backgroundColor: ["#4CAF50", "#2196F3", "#F44336"], // Easy, Medium, Hard
          borderColor: ["#388E3C", "#1976D2", "#D32F2F"],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: "Submissions per Difficulty",
            color: '#666',
            font: { size: 14 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#f0f0f0' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });

    // Store chart reference for cleanup
    (canvas as any)._chart = chart;
    console.log('Chart rendered successfully');
  } catch (error) {
    console.error('Error rendering chart:', error);
    // Show fallback text
    const canvas = document.getElementById("submissionChart") as HTMLCanvasElement;
    if (canvas) {
      canvas.style.display = 'none';
      const fallback = document.createElement('div');
      fallback.innerHTML = '<p style="text-align: center; color: #666;">Chart unavailable</p>';
      canvas.parentNode?.appendChild(fallback);
    }
  }
};

// Simplified data rendering
const renderFromData = (data: LeetCodeData) => {
  try {
    console.log('Rendering data:', data);
    
    // Set values directly without animations
    setValue("totalSolved", data.totalSolved);
    setValue("easySolved", data.easySolved);
    setValue("mediumSolved", data.mediumSolved);
    setValue("hardSolved", data.hardSolved);
    setValue("totalSubmissions", data.totalSubmissions[0]?.submissions || 0);
    setValue("ranking", data.ranking);
    setValue("acceptanceRate", Math.round(data.acceptanceRate));
    
    // Render chart with error handling
    renderSubmissionChart(data.totalSubmissions);
  } catch (error) {
    console.error('Error rendering data:', error);
  }
};

// Enhanced fetch with timeout and retry logic
const fetchWithTimeout = async (url: string, timeout: number = 10000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      },
      mode: 'cors',
      credentials: 'omit'
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Main fetch function with enhanced error handling
const fetchLeetCodeStats = async (): Promise<void> => {
  // Check cache first
  const cached = getCachedData();
  if (cached) {
    console.log("Using cached LeetCode data");
    renderFromData(cached);
    return;
  }

  // Show loading state
  showLoading();

  try {
    console.log("Fetching fresh LeetCode data...");
    
    const response = await fetchWithTimeout(`${API_URL}${USERNAME}`, 15000);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    
    if (!json.leetcode_data) {
      throw new Error('Invalid response format');
    }

    const data: LeetCodeData = json.leetcode_data;
    
    // Cache the data
    setCachedData(data);
    
    // Render the data
    renderFromData(data);
    
    console.log("LeetCode data loaded successfully");
  } catch (error) {
    console.error("Error fetching LeetCode stats:", error);
    
    // Try to use cached data as fallback
    const fallbackData = getCachedData();
    if (fallbackData) {
      console.log("Using fallback cached data");
      renderFromData(fallbackData);
    } else {
      // Show error state
      const elements = ['totalSolved', 'easySolved', 'mediumSolved', 'hardSolved', 'totalSubmissions', 'ranking', 'acceptanceRate'];
      elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.innerHTML = '<span class="error">Failed to load</span>';
          el.classList.add('error');
        }
      });
    }
  } finally {
    hideLoading();
  }
};

// Initialize when DOM is ready
const initializeLeetCodeStats = () => {
  // Add CSS for loading states
  const style = document.createElement('style');
  style.textContent = `
    .loading-dots::after {
      content: '';
      animation: dots 1.5s steps(5, end) infinite;
    }
    
    @keyframes dots {
      0%, 20% { content: ''; }
      40% { content: '.'; }
      60% { content: '..'; }
      80%, 100% { content: '...'; }
    }
    
    .error {
      color: #e74c3c !important;
    }
  `;
  document.head.appendChild(style);

  // Start the process
  fetchLeetCodeStats();
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLeetCodeStats);
} else {
  initializeLeetCodeStats();
}
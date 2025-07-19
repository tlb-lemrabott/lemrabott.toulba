import { CountUp } from "countup.js";

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

// Safe HTML-based chart rendering (no Chart.js dependency)
const renderSubmissionChart = (submissions: SubmissionStats[]) => {
  try {
    const canvas = document.getElementById("submissionChart") as HTMLCanvasElement;
    if (!canvas) {
      console.log('Chart canvas not found');
      return;
    }

    // Hide the canvas and create HTML-based chart
    canvas.style.display = 'none';
    
    // Remove any existing fallback
    const existingFallback = canvas.parentNode?.querySelector('.html-chart');
    if (existingFallback) {
      existingFallback.remove();
    }

    // Filter out 'All' difficulty if present
    const filtered = submissions.filter(s => s.difficulty !== "All");
    
    if (filtered.length === 0) {
      console.log('No submission data to display');
      return;
    }

    // Find max value for scaling
    const maxValue = Math.max(...filtered.map(s => s.submissions));
    
    // Create HTML chart container
    const chartContainer = document.createElement('div');
    chartContainer.className = 'html-chart';
    chartContainer.style.cssText = `
      margin: 20px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    `;

    // Add title
    const title = document.createElement('h4');
    title.textContent = 'Submissions per Difficulty';
    title.style.cssText = 'margin: 0 0 15px 0; color: #333; font-size: 16px; text-align: center;';
    chartContainer.appendChild(title);

    // Create bars
    filtered.forEach((submission, index) => {
      const barContainer = document.createElement('div');
      barContainer.style.cssText = 'margin: 10px 0; display: flex; align-items: center; gap: 10px;';
      
      const label = document.createElement('span');
      label.textContent = submission.difficulty;
      label.style.cssText = 'min-width: 60px; font-weight: 500; color: #555;';
      
      const barWrapper = document.createElement('div');
      barWrapper.style.cssText = 'flex: 1; background: #e9ecef; border-radius: 4px; height: 20px; overflow: hidden;';
      
      const bar = document.createElement('div');
      const percentage = (submission.submissions / maxValue) * 100;
      const colors = ['#4CAF50', '#2196F3', '#F44336']; // Easy, Medium, Hard
      bar.style.cssText = `
        height: 100%;
        width: ${percentage}%;
        background: ${colors[index % colors.length]};
        transition: width 0.5s ease;
        border-radius: 4px;
      `;
      
      const value = document.createElement('span');
      value.textContent = submission.submissions.toString();
      value.style.cssText = 'min-width: 30px; text-align: right; font-weight: 500; color: #333;';
      
      barWrapper.appendChild(bar);
      barContainer.appendChild(label);
      barContainer.appendChild(barWrapper);
      barContainer.appendChild(value);
      chartContainer.appendChild(barContainer);
    });

    // Add to DOM
    canvas.parentNode?.appendChild(chartContainer);
    console.log('HTML chart rendered successfully');
    
  } catch (error) {
    console.error('Error rendering HTML chart:', error);
    // Show simple fallback
    const canvas = document.getElementById("submissionChart") as HTMLCanvasElement;
    if (canvas) {
      canvas.style.display = 'none';
      const fallback = document.createElement('div');
      fallback.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Chart data: ' + 
        submissions.map(s => `${s.difficulty}: ${s.submissions}`).join(', ') + '</p>';
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
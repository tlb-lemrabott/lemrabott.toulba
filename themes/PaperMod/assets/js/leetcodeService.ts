import { CountUp } from "countup.js";

// Import cookie consent manager
import { cookieConsent } from './cookieConsent';

// Import logger
import { debug, info, warn, error } from './logger';

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
    // Loading timeout reached
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
    return null;
  }

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
      return null;
    }

    const parsed: CacheEntry = JSON.parse(cached);
    
    // Check version compatibility
    if (parsed.version !== CACHE_VERSION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    // Check TTL
    const age = Date.now() - parsed.timestamp;
    if (age > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return parsed.data;
  } catch (err) {
    error('Error reading cache:', err);
    // Clear corrupted cache
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (clearErr) {
      error('Failed to clear corrupted cache:', clearErr);
    }
    return null;
  }
};

const setCachedData = (data: LeetCodeData): void => {
  // Check if user has consented to cookies
  if (!cookieConsent.canUseCookies()) {
    return;
  }

  try {
    const cacheEntry: CacheEntry = {
      timestamp: Date.now(),
      data,
      version: CACHE_VERSION
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
  } catch (err) {
    error('Error writing cache:', err);
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
const renderSubmissionChart = (submissions: SubmissionStats[], totalSolved: number) => {
  try {
    const canvas = document.getElementById("submissionChart") as HTMLCanvasElement;
    if (!canvas) {
      return;
    }

    // Hide the canvas and create HTML-based chart
    canvas.style.display = 'none';
    
    // Remove any existing chart
    const existingChart = canvas.parentNode?.querySelector('.html-chart');
    if (existingChart) {
      existingChart.remove();
    }

    // Use solved problems data instead of submissions
    const solvedData = [
      { difficulty: 'Easy', solved: submissions.find(s => s.difficulty === 'Easy')?.count || 0 },
      { difficulty: 'Medium', solved: submissions.find(s => s.difficulty === 'Medium')?.count || 0 },
      { difficulty: 'Hard', solved: submissions.find(s => s.difficulty === 'Hard')?.count || 0 }
    ];
    
    if (totalSolved === 0) {
      return;
    }
    
    // Create HTML chart container
    const chartContainer = document.createElement('div');
    chartContainer.className = 'html-chart';
    chartContainer.style.cssText = `
      margin: 10px 0;
      padding: 15px;
      background: var(--entry);
      border-radius: 8px;
      border: 1px solid var(--border);
    `;

    // Create bars
    solvedData.forEach((item, index) => {
      const barContainer = document.createElement('div');
      barContainer.style.cssText = 'margin: 10px 0; display: flex; align-items: center; gap: 10px;';
      
      const label = document.createElement('span');
      label.textContent = item.difficulty;
      label.style.cssText = 'min-width: 60px; font-weight: 500; color: var(--secondary); text-align: left;';
      
      const barWrapper = document.createElement('div');
      barWrapper.style.cssText = 'flex: 1; background: var(--tertiary); border-radius: 4px; height: 20px; overflow: hidden;';
      
      const bar = document.createElement('div');
      const percentage = (item.solved / totalSolved) * 100;
      const colors = ['#4CAF50', '#2196F3', '#F44336']; // Easy, Medium, Hard
      bar.style.cssText = `
        height: 100%;
        width: ${percentage}%;
        background: ${colors[index % colors.length]};
        transition: width 0.5s ease;
        border-radius: 4px;
      `;
      
      const value = document.createElement('span');
      value.textContent = `${item.solved} (${percentage.toFixed(1)}%)`;
      value.style.cssText = 'min-width: 80px; text-align: right; font-weight: 500; color: var(--primary); font-size: 14px;';
      
      barWrapper.appendChild(bar);
      barContainer.appendChild(label);
      barContainer.appendChild(barWrapper);
      barContainer.appendChild(value);
      chartContainer.appendChild(barContainer);
    });

    // Add to DOM - replace the canvas directly
    if (canvas.parentNode) {
      canvas.parentNode.replaceChild(chartContainer, canvas);
    }
    
      } catch (err) {
      error('Error rendering HTML chart:', err);
    // Show simple fallback
    const canvas = document.getElementById("submissionChart") as HTMLCanvasElement;
    if (canvas) {
      const fallback = document.createElement('div');
      const solvedData = [
        { difficulty: 'Easy', solved: submissions.find(s => s.difficulty === 'Easy')?.count || 0 },
        { difficulty: 'Medium', solved: submissions.find(s => s.difficulty === 'Medium')?.count || 0 },
        { difficulty: 'Hard', solved: submissions.find(s => s.difficulty === 'Hard')?.count || 0 }
      ];
      fallback.innerHTML = '<p style="text-align: center; color: var(--secondary); padding: 20px;">Chart data: ' + 
        solvedData.map(s => `${s.difficulty}: ${s.solved} (${((s.solved / totalSolved) * 100).toFixed(1)}%)`).join(', ') + '</p>';
      canvas.parentNode?.replaceChild(fallback, canvas);
    }
  }
};

// Simplified data rendering
const renderFromData = (data: LeetCodeData) => {
  try {
    // Set values directly without animations
    setValue("totalSolved", data.totalSolved);
    setValue("easySolved", data.easySolved);
    setValue("mediumSolved", data.mediumSolved);
    setValue("hardSolved", data.hardSolved);
    setValue("totalSubmissions", data.totalSubmissions[0]?.submissions || 0);
    setValue("ranking", data.ranking);
    setValue("acceptanceRate", Math.round(data.acceptanceRate));
    
    // Render chart with error handling
    renderSubmissionChart(data.totalSubmissions, data.totalSolved);
  } catch (err) {
    error('Error rendering data:', err);
  }
};

// Enhanced fetch with timeout and retry logic
const fetchWithTimeout = async (url: string, timeout: number = 10000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; LeetCodeStats/1.0)'
      },
      mode: 'cors',
      credentials: 'omit'
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      } else if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to server');
      } else if (error.message.includes('chrome-extension')) {
        throw new Error('Chrome extension cache error - service worker issue');
      }
    }
    
    throw error;
  }
};

// Main fetch function with enhanced error handling and retry logic
const fetchLeetCodeStats = async (retryCount: number = 0): Promise<void> => {
  // Check cache first
  const cached = getCachedData();
  if (cached) {
    // If we have cached data, render it immediately (loading state already shown)
    renderFromData(cached);
    hideLoading();
    return;
  }

  // Loading state already shown in initializeLeetCodeStats, no need to show again

  try {
    const response = await fetchWithTimeout(`${API_URL}${USERNAME}`, 20000); // Increased timeout for cold starts
    
    if (!response.ok) {
      // Handle specific status codes with enhanced cold start detection
      if (response.status === 503 || response.status === 500) {
        // Service temporarily unavailable (likely cold start)
        const retryAfter = response.headers.get('retry-after');
        let delay: number;
        
        if (retryAfter) {
          delay = parseInt(retryAfter) * 1000;
        } else {
          // Enhanced delay strategy for cold starts
          if (retryCount === 0) {
            delay = 2000; // First retry after 2 seconds
          } else if (retryCount === 1) {
            delay = 4000; // Second retry after 4 seconds
          } else {
            delay = 6000; // Third retry after 6 seconds
          }
        }
        
        if (retryCount < 3) { // Max 4 attempts for cold starts
          debug(`Cold start detected, retrying in ${delay}ms (attempt ${retryCount + 1}/4)`);
          // Show loading state again for retry
          showLoading();
          setTimeout(() => fetchLeetCodeStats(retryCount + 1), delay);
          return;
        } else {
          throw new Error(`HTTP ${response.status}: Service temporarily unavailable after ${retryCount + 1} attempts`);
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
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
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    error("Error fetching LeetCode stats:", err);
    
    // Try to use cached data as fallback
    const fallbackData = getCachedData();
    if (fallbackData) {
      renderFromData(fallbackData);
      // Loading will be hidden in finally block
    } else {
      // Show specific error state based on error type
      const elements = ['totalSolved', 'easySolved', 'mediumSolved', 'hardSolved', 'totalSubmissions', 'ranking', 'acceptanceRate'];
      elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
            el.innerHTML = '<span class="error">Timeout</span>';
          } else if (errorMessage.includes('500')) {
            el.innerHTML = '<span class="error">Server Error</span>';
          } else if (errorMessage.includes('404')) {
            el.innerHTML = '<span class="error">Not Found</span>';
          } else {
            el.innerHTML = '<span class="error">Failed to load</span>';
          }
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

  // Show loading state immediately before checking cache or fetching
  showLoading();
  
  // Start fetching data immediately
  fetchLeetCodeStats();
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLeetCodeStats);
} else {
  initializeLeetCodeStats();
}
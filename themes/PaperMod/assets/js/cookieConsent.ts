// Import logger
import { debug, info } from './logger';

interface CookieConsent {
  accepted: boolean;
  timestamp: number;
  version: string;
}

const CONSENT_KEY = 'cookie_consent_v1';
const CONSENT_VERSION = '1.0.0';

class CookieConsentManager {
  private consent: CookieConsent | null = null;
  private toast: HTMLElement | null = null;

  constructor() {
    this.loadConsent();
    this.init();
  }

  private loadConsent(): void {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (stored) {
        this.consent = JSON.parse(stored);
        // Check if consent is still valid (not too old)
        if (this.consent && this.consent.version === CONSENT_VERSION) {
          return;
        }
      }
    } catch (error) {
      console.error('Error loading cookie consent:', error);
    }
    this.consent = null;
  }

  private saveConsent(accepted: boolean): void {
    try {
      this.consent = {
        accepted,
        timestamp: Date.now(),
        version: CONSENT_VERSION
      };
      localStorage.setItem(CONSENT_KEY, JSON.stringify(this.consent));
    } catch (error) {
      console.error('Error saving cookie consent:', error);
    }
  }

  private createToast(): HTMLElement {
    const toast = document.createElement('div');
    toast.id = 'cookie-consent-toast';
    toast.innerHTML = `
      <div class="cookie-consent-content">
        <div class="cookie-consent-text">
          <h4>🍪 Cookie Notice</h4>
          <p>This website uses cookies to enhance your experience. We use localStorage to cache your LeetCode statistics and improve performance.</p>
          <p>By continuing to use this site, you consent to our use of cookies.</p>
        </div>
        <div class="cookie-consent-actions">
          <button id="cookie-accept" class="cookie-btn accept">Accept All</button>
          <button id="cookie-deny" class="cookie-btn deny">Deny</button>
          <a href="/privacy" class="cookie-link">Privacy Policy</a>
        </div>
      </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #cookie-consent-toast {
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        max-width: 500px;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: slideUp 0.3s ease-out;
      }
      
      @keyframes slideUp {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      .cookie-consent-content {
        padding: 20px;
      }
      
      .cookie-consent-text h4 {
        margin: 0 0 10px 0;
        color: #333;
        font-size: 16px;
      }
      
      .cookie-consent-text p {
        margin: 0 0 8px 0;
        color: #666;
        font-size: 14px;
        line-height: 1.4;
      }
      
      .cookie-consent-actions {
        display: flex;
        gap: 10px;
        margin-top: 15px;
        flex-wrap: wrap;
        align-items: center;
      }
      
      .cookie-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
      }
      
      .cookie-btn.accept {
        background: #007bff;
        color: white;
      }
      
      .cookie-btn.accept:hover {
        background: #0056b3;
      }
      
      .cookie-btn.deny {
        background: #6c757d;
        color: white;
      }
      
      .cookie-btn.deny:hover {
        background: #545b62;
      }
      
      .cookie-link {
        color: #007bff;
        text-decoration: none;
        font-size: 14px;
      }
      
      .cookie-link:hover {
        text-decoration: underline;
      }
      
      @media (max-width: 600px) {
        #cookie-consent-toast {
          left: 10px;
          right: 10px;
          bottom: 10px;
        }
        
        .cookie-consent-actions {
          flex-direction: column;
          align-items: stretch;
        }
        
        .cookie-btn {
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
    
    return toast;
  }

  private bindEvents(): void {
    if (!this.toast) return;

    const acceptBtn = this.toast.querySelector('#cookie-accept');
    const denyBtn = this.toast.querySelector('#cookie-deny');

    acceptBtn?.addEventListener('click', () => {
      this.accept();
    });

    denyBtn?.addEventListener('click', () => {
      this.deny();
    });
  }

  private accept(): void {
    this.saveConsent(true);
    this.hideToast();
    info('Cookie consent accepted');
  }

  private deny(): void {
    this.saveConsent(false);
    this.hideToast();
    this.clearCookies();
    info('Cookie consent denied');
  }

  private clearCookies(): void {
    try {
      // Clear localStorage items that might be considered cookies
      localStorage.removeItem('leetcode_cache_v2');
      localStorage.removeItem('cookie_consent_v1');
      console.log('Cookies cleared due to user denial');
    } catch (error) {
      console.error('Error clearing cookies:', error);
    }
  }

  private hideToast(): void {
    if (this.toast) {
      this.toast.style.animation = 'slideDown 0.3s ease-out';
      setTimeout(() => {
        this.toast?.remove();
        this.toast = null;
      }, 300);
    }
  }

  private init(): void {
    // Only show consent if user hasn't made a choice
    if (this.consent === null) {
      setTimeout(() => {
        this.toast = this.createToast();
        document.body.appendChild(this.toast);
        this.bindEvents();
      }, 1000); // Show after 1 second
    }
  }

  public hasConsent(): boolean {
    return this.consent?.accepted === true;
  }

  public canUseCookies(): boolean {
    return this.hasConsent();
  }
}

// Initialize cookie consent manager
const cookieConsent = new CookieConsentManager();

// Export for use in other modules
export { cookieConsent, CookieConsentManager }; 
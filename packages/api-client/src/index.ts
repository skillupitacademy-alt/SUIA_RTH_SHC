import { FetchClient } from './core/fetch-client';
import { AuthClient } from './modules/auth-client';
import { QuizClient } from './modules/quiz-client';
import { AdminClient } from './modules/admin-client';
import { DashboardClient } from './modules/dashboard-client';
import { ReportClient } from './modules/report-client';

/**
 * Smart environment detection for API URL
 * - Local development: http://localhost:3000 (API server port)
 * - Vercel production: https://api.realtutorialhub.com
 * - Vercel preview: Uses the preview API URL
 */
function getApiUrl(): string {
  // Allow manual override via environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    console.log('[API-CLIENT] Using env override:', process.env.NEXT_PUBLIC_API_URL);
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    console.log('[API-CLIENT] Detected hostname:', hostname, 'port:', port);
    
    // Local development - always use port 3000 for API (where api-server runs)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('[API-CLIENT] Using localhost API: http://localhost:3000');
      return 'http://localhost:3000';
    }
    
    // Vercel preview deployment
    if (hostname.includes('vercel.app')) {
      // Extract the preview URL pattern and construct API URL
      // e.g., quiz-platform-web-app-git-preview-xxx.vercel.app
      // becomes quiz-platform-api-server-git-preview-xxx.vercel.app
      const apiHostname = hostname.replace('web-app', 'api-server').replace('admin-app', 'api-server');
      console.log('[API-CLIENT] Using preview API:', `https://${apiHostname}`);
      return `https://${apiHostname}`;
    }
    
    // Production
    if (hostname === 'quiz.realtutorialhub.com' || hostname === 'admin.realtutorialhub.com') {
      console.log('[API-CLIENT] Using production API: https://api.realtutorialhub.com');
      return 'https://api.realtutorialhub.com';
    }
  }

  // Fallback for SSR or unknown environments
  console.log('[API-CLIENT] Using fallback API: https://api.realtutorialhub.com');
  return 'https://api.realtutorialhub.com';
}

const API_URL = getApiUrl();
console.log('[API-CLIENT] Final API URL:', API_URL);

const baseClient = new FetchClient(API_URL);

export const apiClient = {
  auth: new AuthClient(baseClient),
  quiz: new QuizClient(baseClient),
  admin: new AdminClient(baseClient),
  dashboard: new DashboardClient(baseClient),
  reports: new ReportClient(baseClient),
  setAccessToken: (token: string | null) => baseClient.setAccessToken(token),
};

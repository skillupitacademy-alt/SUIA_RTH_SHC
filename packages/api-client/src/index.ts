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
  // 1. Primary Source: Environment Variable (Standard for Vercel/Production)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // 2. Browser Detection for Local Development/Preview
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Dynamic Localhost Detection (assuming API is standard on port 3000)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://${hostname}:3000/api`;
    }
    
    // Vercel Preview/Branch Deployments
    if (hostname.includes('vercel.app')) {
      const apiHostname = hostname.replace('web-app', 'api-server').replace('admin-app', 'api-server');
      return `https://${apiHostname}`;
    }
  }

  // 3. Fallback: Should be avoided by setting env vars, but we'll use a relative path if possible or log error
  return ''; 
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

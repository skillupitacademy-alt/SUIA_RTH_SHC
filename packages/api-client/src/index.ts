import { FetchClient } from './core/fetch-client';
import { AuthClient } from './modules/auth-client';
import { QuizClient } from './modules/quiz-client';
import { AdminClient } from './modules/admin-client';
import { DashboardClient } from './modules/dashboard-client';
import { ReportClient } from './modules/report-client';

/**
 * Smart environment detection for API URL
 * - Production: https://api.realtutorialhub.com
 * - Vercel preview: Uses the preview API URL
 */
function getApiUrl(): string {
  // 1. Primary Source: Environment Variable (Standard for Vercel/Production)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }

  // 2. Browser Detection for Vercel Preview/Custom Domains
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Vercel Preview/Branch Deployments (Automatic)
    // admin.xxx.vercel.app -> api.xxx.vercel.app
    if (hostname.includes('vercel.app')) {
      const apiHostname = hostname
        .replace('web-app.', 'api-server.')
        .replace('admin-app.', 'api-server.')
        .replace('web.', 'api.')
        .replace('admin.', 'api.');
      return `https://${apiHostname}/api`;
    }

    // RealTutorialHub Domain Detection (Production/Staging structure)
    if (hostname.includes('realtutorialhub.com')) {
      return `https://api.realtutorialhub.com/api`;
    }
  }

  // 3. Fallback: Relative for same-origin (safe in many Vercel setups)
  return '/api'; 
}

function getAdminUrl(): string {
  // 1. Primary Source: Environment Variable
  if (process.env.NEXT_PUBLIC_ADMIN_URL) {
    return process.env.NEXT_PUBLIC_ADMIN_URL.replace(/\/$/, '');
  }

  // 2. Browser Detection for Vercel Preview
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Vercel Preview/Branch Deployments
    if (hostname.includes('vercel.app')) {
      const adminHostname = hostname
        .replace('web-app.', 'admin-app.')
        .replace('web.', 'admin.');
      return `https://${adminHostname}`;
    }

    // RealTutorialHub Domain Detection
    if (hostname.includes('realtutorialhub.com')) {
      return `https://admin.realtutorialhub.com`;
    }
  }

  return '#'; 
}

const API_URL = getApiUrl();
const ADMIN_URL = getAdminUrl();


const baseClient = new FetchClient(API_URL);

export * from './modules/auth-client';
export * from './modules/quiz-client';
export * from './modules/admin-client';
export * from './modules/dashboard-client';
export * from './modules/report-client';

export const apiClient = {
  auth: new AuthClient(baseClient),
  quiz: new QuizClient(baseClient),
  admin: new AdminClient(baseClient),
  dashboard: new DashboardClient(baseClient),
  reports: new ReportClient(baseClient),
  client: baseClient, // Export the base client for advanced usage
  setAccessToken: (token: string | null) => baseClient.setAccessToken(token),
  getAdminUrl: () => ADMIN_URL,
};

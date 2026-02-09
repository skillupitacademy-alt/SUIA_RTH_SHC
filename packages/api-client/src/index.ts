import { FetchClient } from './core/fetch-client';
import { AuthClient } from './modules/auth-client';
import { QuizClient } from './modules/quiz-client';
import { AdminClient } from './modules/admin-client';
import { DashboardClient } from './modules/dashboard-client';
import { SearchClient } from './modules/search-client';
import { ReportClient } from './modules/report-client';
import { TelemetryClient } from './modules/telemetry-client';

function getApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('vercel.app')) {
      const apiHostname = hostname
        .replace('web-app.', 'api-server.')
        .replace('admin-app.', 'api-server.')
        .replace('web.', 'api.')
        .replace('admin.', 'api.');
      return `https://${apiHostname}/api`;
    }
    if (hostname.includes('realtutorialhub.com')) {
      return `https://api.realtutorialhub.com/api`;
    }
  }
  return '/api'; 
}

function getAdminUrl(): string {
  if (process.env.NEXT_PUBLIC_ADMIN_URL) {
    return process.env.NEXT_PUBLIC_ADMIN_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('vercel.app')) {
      const adminHostname = hostname
        .replace('web-app.', 'admin-app.')
        .replace('web.', 'admin.');
      return `https://${adminHostname}`;
    }
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
export * from './modules/search-client';
export * from './modules/telemetry-client';

export const apiClient = {
  auth: new AuthClient(baseClient),
  quiz: new QuizClient(baseClient),
  admin: new AdminClient(baseClient),
  dashboard: new DashboardClient(baseClient),
  reports: new ReportClient(baseClient),
  search: new SearchClient(baseClient),
  telemetry: new TelemetryClient(baseClient),
  client: baseClient,
  getAdminUrl: () => ADMIN_URL,
};

import { FetchClient } from './core/fetch-client';
import { AuthClient } from './modules/auth-client';
import { QuizClient } from './modules/quiz-client';
import { AdminClient } from './modules/admin-client';
import { DashboardClient } from './modules/dashboard-client';
import { SearchClient } from './modules/search-client';
import { AnalyticsClient } from './modules/analytics-client';
import { ReportClient } from './modules/report-client';
import { TelemetryClient } from './modules/telemetry-client';

function getApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    let url = process.env.NEXT_PUBLIC_API_URL.trim();
    url = url.replace(/\/+$/, ''); // strip trailing slash(es)
    // Ensure the path ends with /api to hit Next routes correctly
    if (!url.toLowerCase().endsWith('/api')) {
      url = `${url}/api`;
    }
    return url;
  }
  return '/api';
}

function getAdminUrl(): string {
  if (process.env.NEXT_PUBLIC_ADMIN_URL) {
    return process.env.NEXT_PUBLIC_ADMIN_URL.replace(/\/$/, '');
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
export * from './modules/analytics-client';
export * from './types';

export const apiClient = {
  auth: new AuthClient(baseClient),
  quiz: new QuizClient(baseClient),
  admin: new AdminClient(baseClient),
  dashboard: new DashboardClient(baseClient),
  reports: new ReportClient(baseClient),
  search: new SearchClient(baseClient),
  telemetry: new TelemetryClient(baseClient),
  analytics: new AnalyticsClient(baseClient),
  client: baseClient,
  getAdminUrl: () => ADMIN_URL,
};

/**
 * Environment Configuration Loader
 * Strictly uses production configuration for Vercel deployment.
 */

import { config as productionConfig } from './production.config';

export const config = productionConfig;

// Production-only constants
export const isDevelopment = false;
export const isProduction = true;

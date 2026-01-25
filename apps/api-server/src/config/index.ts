/**
 * Environment Configuration Loader
 * Automatically loads the correct configuration based on NODE_ENV
 */

import { config as localConfig } from './local.config';
import { config as productionConfig } from './production.config';

const isProd = process.env.NODE_ENV === 'production';

export const config = isProd ? productionConfig : localConfig;

// Helper to check if we're in development
export const isDevelopment = !isProd;
export const isProduction = isProd;

#!/usr/bin/env node

/**
 * Phase 0A.2.2-A
 *
 * Canonical database/service definitions used by the
 * static source-code architecture analyzer.
 *
 * READ-ONLY.
 */

export const DATABASES = [
  {
    logicalName: 'quiz_platform_prod',
    envVars: ['DATABASE_URL'],
    packagePaths: [
      'packages/db',
    ],
  },

  {
    logicalName: 'tutorial_prod',
    envVars: ['DATABASE_URL_TUTORIAL'],
    packagePaths: [
      'packages/db-tutorial',
    ],
  },

  {
    logicalName: 'people_prod',
    envVars: ['DATABASE_URL_PEOPLE'],
    packagePaths: [
      'packages/db-people',
    ],
  },

  {
    logicalName: 'rth_prod',
    envVars: ['DATABASE_URL_RTH'],
    packagePaths: [
      'packages/db-rth',
    ],
  },

  {
    logicalName: 'skillup_prod',
    envVars: ['DATABASE_URL_SKILLUP'],
    packagePaths: [
      'packages/db-skillup',
    ],
  },

  {
    logicalName: 'payment_prod',
    envVars: ['DATABASE_URL_PAYMENT'],
    packagePaths: [
      'packages/db-payment',
    ],
  },

  {
    logicalName: 'placement_prod',
    envVars: ['DATABASE_URL_PLACEMENT'],
    packagePaths: [
      'packages/db-placement',
    ],
  },
];

export const SERVICES = [
  {
    name: 'api-server',
    path: 'apps/api-server',
  },

  {
    name: 'realtutorialhub-web',
    path: 'apps/realtutorialhub-web',
  },

  {
    name: 'skillup-web',
    path: 'apps/skillup-web',
  },

  {
    name: 'skillhubcore-admin',
    path: 'apps/skillhubcore-admin',
  },

  {
    name: 'skillhub-placement',
    path: 'apps/skillhub-placement',
  },

  {
    name: 'tutorial-service',
    path: 'apps/tutorial-service',
  },

  {
    name: 'payment-service',
    path: 'apps/payment-service',
  },

  {
    name: 'placement-service',
    path: 'apps/placement-service',
  },
];

/**
 * Database package import patterns.
 *
 * These patterns deliberately support multiple styles because
 * the repository may contain transitional implementations.
 */
export const DATABASE_PATTERNS = {
  quiz_platform_prod: [
    '@quiz/db',
    'packages/db',
    '@/lib/db',
    'getDb',
    'getQuizDb',
    'quizDb',
  ],

  tutorial_prod: [
    '@quiz/db-tutorial',
    'packages/db-tutorial',
    'getTutorialDb',
    'tutorialDb',
  ],

  people_prod: [
    '@quiz/db-people',
    'packages/db-people',
    'getPeopleDb',
    'peopleDb',
  ],

  rth_prod: [
    '@quiz/db-rth',
    'packages/db-rth',
    'getRthDb',
    'rthDb',
  ],

  skillup_prod: [
    '@quiz/db-skillup',
    '@quiz/db-skillhubcore',
    'packages/db-skillup',
    'packages/db-skillhubcore',
    'getSkillupDb',
    'skillupDb',
  ],

  payment_prod: [
    '@quiz/db-payment',
    'packages/db-payment',
    'getPaymentDb',
    'paymentDb',
  ],

  placement_prod: [
    '@quiz/db-placement',
    'packages/db-placement',
    'getPlacementDb',
    'placementDb',
  ],
};

export const HTTP_SERVICE_PATTERNS = [
  '/api/',
  'fetch(',
  'axios.',
  'http.request',
  'https.request',
];

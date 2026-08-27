'use strict';

/**
 * Phase 2.5 Runtime Test Configuration
 *
 * IMPORTANT:
 * - Local development only.
 * - Never put real production credentials in this file.
 * - Values can be overridden with environment variables.
 */

const config = {
  apiServerUrl:
    process.env.PHASE25_API_SERVER_URL ||
    'http://127.0.0.1:3000',

  apiGatewayUrl:
    process.env.PHASE25_API_GATEWAY_URL ||
    'http://127.0.0.1:8787',

  adminUrl:
    process.env.PHASE25_ADMIN_URL ||
    'http://127.0.0.1:3007',

  /**
   * The learner route must be supplied from the actual test data.
   *
   * Example:
   *
   * /tutorial-v2/python/programming/basics/variables/<navigationNodeId>
   *
   * Do not invent this.
   */
  tutorialPath:
    process.env.PHASE25_TUTORIAL_PATH || null,

  /**
   * Existing learner authentication can be supplied as a cookie
   * through the environment when necessary.
   *
   * Never print it.
   */
  learnerCookie:
    process.env.PHASE25_LEARNER_COOKIE || null,

  learnerId:
    process.env.PHASE25_LEARNER_ID || null,

  navigationNodeId:
    process.env.PHASE25_NAVIGATION_NODE_ID || null,

  subtopicId:
    process.env.PHASE25_SUBTOPIC_ID || null,

  sectionId:
    process.env.PHASE25_SECTION_ID || null,

  progressApiPath:
    process.env.PHASE25_PROGRESS_API_PATH ||
    '/api/tutorial/progress',

  requestTimeoutMs:
    Number(process.env.PHASE25_TIMEOUT_MS || 15000),
};

module.exports = {
  config,
};

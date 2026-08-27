'use strict';

const { config } = require('./phase-25-runtime-config');

function logSection(title) {
  console.log('');
  console.log('='.repeat(72));
  console.log(title);
  console.log('='.repeat(72));
}

function logPass(message, details) {
  console.log(`  PASS  ${message}`);

  if (details !== undefined) {
    console.log(`        ${details}`);
  }
}

function logFail(message, details) {
  console.error(`  FAIL  ${message}`);

  if (details !== undefined) {
    console.error(`        ${details}`);
  }
}

function logSkip(message, details) {
  console.log(`  SKIP  ${message}`);

  if (details !== undefined) {
    console.log(`        ${details}`);
  }
}

function assert(condition, message, details) {
  if (!condition) {
    const error = new Error(message);

    if (details) {
      error.details = details;
    }

    throw error;
  }
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, config.requestTimeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function buildHeaders(extra = {}) {
  const headers = {
    Accept: 'application/json',
    ...extra,
  };

  if (config.learnerCookie) {
    headers.Cookie = config.learnerCookie;
  }

  if (config.learnerId) {
    headers['x-user-id'] = config.learnerId;
  }

  return headers;
}

async function readResponse(response) {
  const contentType =
    response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

function sanitize(value) {
  if (value === undefined || value === null) {
    return value;
  }

  if (typeof value === 'string') {
    return value
      .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
      .replace(/access_token=[^&\s]+/gi, 'access_token=[REDACTED]')
      .replace(/refresh_token=[^&\s]+/gi, 'refresh_token=[REDACTED]');
  }

  if (Array.isArray(value)) {
    return value.map(sanitize);
  }

  if (typeof value === 'object') {
    const result = {};

    for (const [key, item] of Object.entries(value)) {
      if (
        /token|authorization|cookie|password|secret/i.test(key)
      ) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = sanitize(item);
      }
    }

    return result;
  }

  return value;
}

module.exports = {
  logSection,
  logPass,
  logFail,
  logSkip,
  assert,
  fetchWithTimeout,
  buildHeaders,
  readResponse,
  sanitize,
};

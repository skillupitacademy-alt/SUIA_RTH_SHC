'use strict';

const {
  config,
} = require('./phase-25-runtime-config');

const {
  logSection,
  logPass,
  logFail,
  logSkip,
  assert,
  fetchWithTimeout,
  buildHeaders,
  readResponse,
  sanitize,
} = require('./phase-25-runtime-utils');

async function getProgress() {
  if (!config.subtopicId) {
    logSkip(
      'Progress GET',
      'PHASE25_SUBTOPIC_ID is not configured'
    );

    return null;
  }

  const url =
    `${config.apiServerUrl}` +
    `${config.progressApiPath}` +
    `?subtopicId=${encodeURIComponent(config.subtopicId)}`;

  try {
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: buildHeaders(),
    });

    const body = await readResponse(response);

    if (!response.ok) {
      logFail(
        'Progress GET failed',
        `HTTP ${response.status}: ${JSON.stringify(sanitize(body))}`
      );

      return false;
    }

    logPass(
      'Progress GET succeeded',
      `HTTP ${response.status}`
    );

    console.log(
      '        Response:',
      JSON.stringify(sanitize(body), null, 2)
    );

    return body;
  } catch (error) {
    logFail(
      'Progress GET request failed',
      error.message
    );

    return false;
  }
}

async function verifyCurrentContract() {
  logSection('PROGRESS API CONTRACT');

  if (!config.subtopicId) {
    logSkip(
      'Progress API contract',
      'No PHASE25_SUBTOPIC_ID supplied'
    );

    return null;
  }

  const url =
    `${config.apiServerUrl}${config.progressApiPath}`;

  const body = {
    subtopicId: config.subtopicId,

    /**
     * IMPORTANT:
     * This is the existing API contract.
     *
     * Do not add navigationNodeId here.
     * This test is specifically verifying the current backend.
     */
    blockType: 'definition',
    status: 'viewed',
  };

  try {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: buildHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(body),
    });

    const responseBody = await readResponse(response);

    if (!response.ok) {
      logFail(
        'Progress POST failed',
        `HTTP ${response.status}: ${JSON.stringify(
          sanitize(responseBody)
        )}`
      );

      return false;
    }

    logPass(
      'Existing progress POST contract succeeds',
      `HTTP ${response.status}`
    );

    return true;
  } catch (error) {
    logFail(
      'Progress POST request failed',
      error.message
    );

    return false;
  }
}

async function main() {
  console.log('');
  console.log('PHASE 2.5 PROGRESS API TEST');

  await getProgress();
  await verifyCurrentContract();

  console.log('');
  console.log(
    'IMPORTANT: This test does NOT prove navigation-node progress.'
  );
  console.log(
    'It only verifies the existing subtopic/blockType API contract.'
  );
}

main().catch(error => {
  console.error(
    'Fatal progress test error:',
    error
  );

  process.exitCode = 1;
});

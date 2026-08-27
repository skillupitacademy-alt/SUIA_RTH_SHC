'use strict';

const { config } = require('./phase-25-runtime-config');

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

async function testApiServer() {
  logSection('API SERVER');

  const url = `${config.apiServerUrl}/api/shc/auth/me`;

  try {
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: buildHeaders(),
    });

    const body = await readResponse(response);

    assert(
      response.status >= 200 && response.status < 500,
      `Unexpected API server response: ${response.status}`,
      sanitize(body)
    );

    logPass(
      'API server reachable',
      `${url} → HTTP ${response.status}`
    );

    return true;
  } catch (error) {
    logFail(
      'API server unavailable',
      error.message
    );

    return false;
  }
}

async function testGateway() {
  logSection('API GATEWAY');

  const url = `${config.apiGatewayUrl}/api/shc/auth/me`;

  try {
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: buildHeaders(),
    });

    const body = await readResponse(response);

    assert(
      response.status >= 200 && response.status < 500,
      `Unexpected gateway response: ${response.status}`,
      sanitize(body)
    );

    logPass(
      'API gateway reachable',
      `${url} → HTTP ${response.status}`
    );

    return true;
  } catch (error) {
    logFail(
      'API gateway unavailable',
      error.message
    );

    return false;
  }
}

async function testTutorialRoute() {
  logSection('TUTORIAL V2 ROUTE');

  if (!config.tutorialPath) {
    logSkip(
      'Tutorial route test',
      'PHASE25_TUTORIAL_PATH is not configured'
    );

    return null;
  }

  const url =
    `${config.apiServerUrl}${config.tutorialPath}`;

  try {
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: buildHeaders({
        Accept: 'text/html,application/xhtml+xml',
      }),
    });

    const body = await readResponse(response);

    assert(
      response.status >= 200 && response.status < 500,
      `Unexpected tutorial response: ${response.status}`,
      sanitize(body)
    );

    if (response.status === 200) {
      logPass(
        'Tutorial V2 route responds',
        `${config.tutorialPath} → HTTP 200`
      );
    } else {
      logFail(
        'Tutorial V2 route did not return 200',
        `HTTP ${response.status}`
      );
    }

    return response.status === 200;
  } catch (error) {
    logFail(
      'Tutorial route request failed',
      error.message
    );

    return false;
  }
}

async function main() {
  console.log('');
  console.log('PHASE 2.5 RUNTIME ROUTE TEST');

  const results = [];

  results.push(await testApiServer());
  results.push(await testGateway());
  results.push(await testTutorialRoute());

  const failures = results.filter(
    value => value === false
  );

  console.log('');

  if (failures.length > 0) {
    console.error(
      `Runtime route test FAILED: ${failures.length} test(s)`
    );

    process.exitCode = 1;
    return;
  }

  console.log(
    'Runtime route test completed without detected failures.'
  );
}

main().catch(error => {
  console.error('Fatal runtime route test error:', error);
  process.exitCode = 1;
});

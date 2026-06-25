import { pathToFileURL } from 'node:url';

export const requiredEnv = [
  'MARKETING_VALIDATION_SHC_BASE_URL',
  'MARKETING_VALIDATION_COLLECTOR_BASE_URL',
  'MARKETING_VALIDATION_RTH_SITE_URL',
  'MARKETING_VALIDATION_SUIA_SITE_URL',
  'MARKETING_VALIDATION_ANALYTICS_ADMIN_TOKEN',
];

export function readRuntimeConfig(env = process.env) {
  for (const key of requiredEnv) {
    if (!env[key] || !env[key].trim()) {
      throw new Error(`missing_required_env:${key}`);
    }
  }

  return {
    shcBaseUrl: normalizeBaseUrl(env.MARKETING_VALIDATION_SHC_BASE_URL),
    collectorBaseUrl: normalizeBaseUrl(env.MARKETING_VALIDATION_COLLECTOR_BASE_URL),
    rthSiteUrl: normalizeBaseUrl(env.MARKETING_VALIDATION_RTH_SITE_URL),
    suiaSiteUrl: normalizeBaseUrl(env.MARKETING_VALIDATION_SUIA_SITE_URL),
    analyticsAdminToken: env.MARKETING_VALIDATION_ANALYTICS_ADMIN_TOKEN,
  };
}

export function normalizeBaseUrl(value) {
  return value.trim().replace(/\/+$/, '');
}

export function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export async function fetchWithExpectations(label, url, init = {}, expectedStatuses = [200]) {
  const response = await fetch(url, init);
  if (!expectedStatuses.includes(response.status)) {
    const body = await response.text();
    throw new Error(`${label} failed with status ${response.status}: ${body.slice(0, 400)}`);
  }

  return response;
}

export async function fetchJson(label, url, init = {}, expectedStatuses = [200]) {
  const response = await fetchWithExpectations(label, url, init, expectedStatuses);
  const body = await response.json();
  return { response, body };
}

export function logStep(message) {
  console.log(`• ${message}`);
}

export async function validateShcMarketingSurface({ shcBaseUrl }) {
  logStep('Validating SHC health and governed marketing APIs');

  const { body: health } = await fetchJson('SHC health', `${shcBaseUrl}/healthz`);
  assert(health.status === 'ok', 'SHC health payload missing status=ok');

  const bootstrapChecks = ['realtutorialhub', 'skillupitacademy'];

  for (const brandId of bootstrapChecks) {
    const { body: bootstrap } = await fetchJson(
      `SHC bootstrap ${brandId}`,
      `${shcBaseUrl}/public/marketing/bootstrap/${brandId}`,
      {
        headers: {
          accept: 'application/json',
        },
      },
    );

    assert(bootstrap?.content?.brandId === brandId, `Bootstrap brandId mismatch for ${brandId}`);
    assert(Array.isArray(bootstrap?.content?.navigation?.navItems), `Bootstrap navItems missing for ${brandId}`);
    assert(Array.isArray(bootstrap?.controlPlane?.experiments), `Bootstrap experiments missing for ${brandId}`);
    assert(
      bootstrap?.content?.contact?.config?.phoneNumber,
      `Bootstrap contact config missing phone number for ${brandId}`,
    );
    assert(Array.isArray(bootstrap?.content?.contact?.info), `Bootstrap contact info missing for ${brandId}`);

    const { body: controlPlane } = await fetchJson(
      `SHC control plane ${brandId}`,
      `${shcBaseUrl}/public/marketing/control-plane/${brandId}`,
      {
        headers: {
          accept: 'application/json',
        },
      },
    );

    assert(Array.isArray(controlPlane?.experiments), `Control plane experiments missing for ${brandId}`);
    assert(
      controlPlane?.experiments?.some?.((item) => item?.key === 'home-hero'),
      `Control plane home-hero experiment missing for ${brandId}`,
    );
    assert(
      typeof controlPlane?.personalization?.deviceHintsEnabled === 'boolean',
      `Control plane personalization flags missing for ${brandId}`,
    );
  }

  const { body: courseCatalog } = await fetchJson(
    'SHC courses catalog',
    `${shcBaseUrl}/public/marketing/courses`,
    {
      headers: {
        accept: 'application/json',
      },
    },
  );

  assert(Array.isArray(courseCatalog?.courses), 'Course catalog missing courses array');
  assert(courseCatalog.courses.length > 0, 'Course catalog returned no courses');
  assert(Array.isArray(courseCatalog?.categories), 'Course catalog missing categories array');

  const courseSlug = courseCatalog.courses[0]?.slug;
  assert(courseSlug, 'First course slug missing from course catalog');

  const { body: coursePage } = await fetchJson(
    'SHC course detail',
    `${shcBaseUrl}/public/marketing/courses/${courseSlug}`,
    {
      headers: {
        accept: 'application/json',
      },
    },
  );

  assert(coursePage?.course?.slug === courseSlug, 'Course detail slug mismatch');
  return courseSlug;
}

export async function validateCollector({ collectorBaseUrl, rthSiteUrl, analyticsAdminToken }) {
  logStep('Validating analytics collector health, ingestion, and observability');

  const { body: health } = await fetchJson('Collector health', `${collectorBaseUrl}/healthz`);
  assert(health.status === 'ok', 'Collector health payload missing status=ok');

  const eventBody = {
    name: 'education.course_viewed',
    payload: {
      courseSlug: 'data-analyst',
      courseName: 'Data Analyst',
    },
    context: {
      brandId: 'realtutorialhub',
      schemaVersion: 1,
      page: {
        url: `${rthSiteUrl}/courses/data-analyst`,
        path: '/courses/data-analyst',
        hostname: new URL(rthSiteUrl).hostname,
      },
      attribution: {
        source: 'deployment-validation',
        medium: 'script',
        campaign: 'hybrid-rollout',
      },
      device: {
        userAgent: 'marketing-validation-bot/1.0',
        type: 'desktop',
      },
      user: {
        anonymousId: 'deploy_validation_anon',
        loggedInState: 'anonymous',
      },
      session: {
        sessionId: `sess_${Date.now()}`,
        requestId: `req_${Date.now()}`,
        occurredAt: new Date().toISOString(),
      },
      metadata: {
        validation: true,
      },
    },
  };

  const { body: ingestion } = await fetchJson(
    'Collector track',
    `${collectorBaseUrl}/track`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        'x-analytics-brand': 'realtutorialhub',
      },
      body: JSON.stringify(eventBody),
    },
    [202],
  );

  assert(ingestion.ok === true, 'Collector ingestion did not return ok=true');
  assert(typeof ingestion.eventId === 'string' && ingestion.eventId.length > 0, 'Collector eventId missing');

  const { body: observability } = await fetchJson(
    'Collector observability',
    `${collectorBaseUrl}/observability`,
    {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${analyticsAdminToken}`,
      },
    },
  );

  assert(observability.ok === true, 'Collector observability did not return ok=true');
  assert(typeof observability?.state?.deadLetterDepth === 'number', 'Collector deadLetterDepth missing');
  assert(typeof observability?.state?.queuedEvents === 'number', 'Collector queuedEvents missing');
}

export async function validateBrandSite({ label, brandId, baseUrl, courseSlug }) {
  logStep(`Validating ${label} hybrid site`);

  const homeResponse = await fetchWithExpectations(
    `${label} homepage`,
    `${baseUrl}/?utm_source=deployment-validation&utm_medium=script&utm_campaign=hybrid-rollout`,
    {
      headers: {
        'user-agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        accept: 'text/html',
      },
    },
  );
  const homeHtml = await homeResponse.text();

  assert(homeHtml.includes('<html'), `${label} homepage did not return HTML`);
  assert(homeResponse.headers.get('x-brand') === brandId, `${label} x-brand header mismatch`);
  assert(homeResponse.headers.get('x-device-type') === 'mobile', `${label} x-device-type header mismatch`);

  const experimentVariant = homeResponse.headers.get('x-experiment-home-hero');
  assert(
    experimentVariant === 'control' || experimentVariant === 'variant-a',
    `${label} experiment header missing or invalid`,
  );

  const personalizationHints = homeResponse.headers.get('x-personalization-hints') ?? '';
  assert(personalizationHints.includes('device'), `${label} personalization hints missing device`);
  assert(personalizationHints.includes('campaign'), `${label} personalization hints missing campaign`);

  const setCookie = homeResponse.headers.get('set-cookie') ?? '';
  assert(setCookie.includes('shc_exp_home_hero='), `${label} experiment cookie missing`);
  assert(setCookie.includes('shc_attr='), `${label} attribution cookie missing`);

  const courseResponse = await fetchWithExpectations(
    `${label} course page`,
    `${baseUrl}/courses/${courseSlug}`,
    {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
        accept: 'text/html',
      },
    },
  );
  const courseHtml = await courseResponse.text();

  assert(courseHtml.includes('<html'), `${label} course page did not return HTML`);
  assert(courseResponse.headers.get('x-brand') === brandId, `${label} course page x-brand mismatch`);
  assert(
    courseResponse.headers.get('x-experiment-home-hero') === experimentVariant ||
      ['control', 'variant-a'].includes(courseResponse.headers.get('x-experiment-home-hero') ?? ''),
    `${label} course page experiment header missing`,
  );
}

export async function main(env = process.env) {
  const runtime = readRuntimeConfig(env);
  const { shcBaseUrl, collectorBaseUrl, rthSiteUrl, suiaSiteUrl, analyticsAdminToken } = runtime;

  console.log('🔍 Running hybrid marketing deployment validation...');
  const courseSlug = await validateShcMarketingSurface({ shcBaseUrl });
  await validateCollector({ collectorBaseUrl, rthSiteUrl, analyticsAdminToken });
  await validateBrandSite({
    label: 'RTH marketing',
    brandId: 'realtutorialhub',
    baseUrl: rthSiteUrl,
    courseSlug,
  });
  await validateBrandSite({
    label: 'SUIA marketing',
    brandId: 'skillupitacademy',
    baseUrl: suiaSiteUrl,
    courseSlug,
  });
  console.log('✅ Hybrid marketing deployment validation passed');
}

const isDirectExecution = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectExecution) {
  main().catch((error) => {
    console.error(`❌ Hybrid marketing deployment validation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}

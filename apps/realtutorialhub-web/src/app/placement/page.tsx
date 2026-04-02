import { PlacementBridgeClient } from './PlacementBridgeClient';

type PlacementPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeRedirectTarget(rawValue?: string) {
  if (typeof rawValue === 'string' && rawValue.startsWith('/') && rawValue.startsWith('//') === false) {
    return rawValue;
  }

  return '/?brand=realtutorialhub';
}

export default async function PlacementPage({ searchParams }: PlacementPageProps) {
  const resolvedSearchParams = (await (searchParams ?? Promise.resolve({}))) as Record<string, string | string[] | undefined>;
  const redirectTarget = normalizeRedirectTarget(firstParam(resolvedSearchParams.redirect));

  return <PlacementBridgeClient redirectTarget={redirectTarget} />;
}

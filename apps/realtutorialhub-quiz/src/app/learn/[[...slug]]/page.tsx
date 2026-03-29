import { redirect } from 'next/navigation';

type LearnRedirectPageProps = {
  params: Promise<{
    slug?: string[];
  }>;
};

function getTutorialBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_WEB_APP_URL?.trim();
  if (typeof base === 'string' && base.length > 0) {
    return base.replace(/\/+$/, '');
  }

  return 'https://notes.realtutorialhub.com';
}

export default async function LearnRedirectPage({ params }: LearnRedirectPageProps) {
  const resolved = await params;
  const slug = resolved.slug ?? [];
  const target = slug.length === 0
    ? getTutorialBaseUrl()
    : `${getTutorialBaseUrl()}/learn/${slug.map((part) => encodeURIComponent(part)).join('/')}`;

  redirect(target);
}

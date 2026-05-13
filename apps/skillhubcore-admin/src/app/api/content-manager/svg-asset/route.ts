import { NextRequest, NextResponse } from 'next/server';

const MAX_SVG_BYTES = 250 * 1024;

function asPositiveInteger(value: FormDataEntryValue | null, fallback: number) {
  if (typeof value !== 'string') return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function asTrimmedString(value: FormDataEntryValue | null, fallback = '') {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function rejectUnsafeSvg(svg: string) {
  const bannedPatterns = [
    /<script\b/i,
    /\bon[a-z]+\s*=/i,
    /<foreignObject\b/i,
    /javascript:/i,
  ];

  return bannedPatterns.some((pattern) => pattern.test(svg));
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const markupField = formData.get('svgMarkup');
    const name = asTrimmedString(formData.get('name'), 'tutorial-asset');
    const alt = asTrimmedString(formData.get('alt'));
    const caption = asTrimmedString(formData.get('caption'));
    const width = asPositiveInteger(formData.get('width'), 1200);
    const height = asPositiveInteger(formData.get('height'), 700);

    let svgMarkup = '';

    if (file instanceof File) {
      if (file.size > MAX_SVG_BYTES) {
        return NextResponse.json({ error: 'SVG file is too large. Keep it under 250 KB.' }, { status: 400 });
      }
      svgMarkup = await file.text();
    } else if (typeof markupField === 'string' && markupField.trim().length > 0) {
      svgMarkup = markupField.trim();
    } else {
      return NextResponse.json({ error: 'Provide an SVG file or SVG markup.' }, { status: 400 });
    }

    if (!svgMarkup.includes('<svg')) {
      return NextResponse.json({ error: 'The uploaded content is not a valid SVG document.' }, { status: 400 });
    }

    if (rejectUnsafeSvg(svgMarkup)) {
      return NextResponse.json(
        { error: 'SVG contains disallowed elements or event handlers. Remove scripts, foreignObject, and inline JS handlers.' },
        { status: 400 }
      );
    }

    const dataUri = `data:image/svg+xml;base64,${Buffer.from(svgMarkup, 'utf8').toString('base64')}`;

    return NextResponse.json({
      asset: {
        type: 'inline_svg',
        name,
        alt,
        width,
        height,
        dataUri,
        ...(caption ? { caption } : {}),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

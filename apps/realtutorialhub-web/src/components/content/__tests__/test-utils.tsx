import { NextIntlClientProvider } from 'next-intl';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';

import enMessages from '../../../../messages/en.json';

export function renderWithIntl(element: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      {element}
    </NextIntlClientProvider>
  );
}

export async function runAxe(container: HTMLElement) {
  const axe = await import('axe-core');
  return axe.run(container);
}

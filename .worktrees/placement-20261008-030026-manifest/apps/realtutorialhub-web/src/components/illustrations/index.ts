import type { FC } from 'react';

export { PromiseChainSVG } from './full-stack/PromiseChainSVG';
export { AsyncAwaitFlowSVG } from './full-stack/AsyncAwaitFlowSVG';

import { PromiseChainSVG } from './full-stack/PromiseChainSVG';
import { AsyncAwaitFlowSVG } from './full-stack/AsyncAwaitFlowSVG';

const SVG_MAP: Record<string, FC<{ width?: number }>> = {
  'promise-chain': PromiseChainSVG,
  'async-await-flow': AsyncAwaitFlowSVG,
};

export function getSVGComponent(svgKey: string): FC<{ width?: number }> | null {
  return SVG_MAP[svgKey] ?? null;
}


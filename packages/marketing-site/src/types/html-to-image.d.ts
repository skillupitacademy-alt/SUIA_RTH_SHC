declare module "html-to-image" {
  interface ToPngOptions {
    cacheBust?: boolean;
    pixelRatio?: number;
    backgroundColor?: string;
    canvasWidth?: number;
    canvasHeight?: number;
  }

  export function toPng(
    node: HTMLElement,
    options?: ToPngOptions,
  ): Promise<string>;
}

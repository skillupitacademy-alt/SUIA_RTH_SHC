declare module "jspdf" {
  interface JsPdfOptions {
    orientation?: "portrait" | "landscape" | "p" | "l";
    unit?: string;
    format?: [number, number] | string;
  }

  export class jsPDF {
    constructor(options?: JsPdfOptions);
    addImage(
      imageData: string,
      format: string,
      x: number,
      y: number,
      width: number,
      height: number,
    ): void;
    save(filename: string): void;
  }
}

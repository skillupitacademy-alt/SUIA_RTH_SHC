declare module "qrcode" {
  interface QrColorOptions {
    dark?: string;
    light?: string;
  }

  interface QrToStringOptions {
    type?: "svg" | "terminal" | "utf8";
    margin?: number;
    width?: number;
    color?: QrColorOptions;
  }

  function toString(
    text: string,
    options?: QrToStringOptions,
  ): Promise<string>;

  const QRCode: {
    toString: typeof toString;
  };

  export default QRCode;
}

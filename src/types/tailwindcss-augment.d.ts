declare module 'tailwindcss' {
  export interface Config {
    safelist?: Array<
      | string
      | {
          pattern: RegExp;
          variants?: string[];
        }
    >;
  }
}

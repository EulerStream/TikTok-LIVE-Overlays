declare module "tiged" {
  interface TigedOptions {
    disableCache?: boolean;
    force?: boolean;
    verbose?: boolean;
    mode?: string;
  }

  interface TigedEmitter {
    clone(dest: string): Promise<void>;
    on(event: string, callback: (info: unknown) => void): void;
  }

  export default function tiged(src: string, options?: TigedOptions): TigedEmitter;
}

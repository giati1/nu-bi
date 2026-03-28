type CloudflareBindings = {
  DB?: {
    prepare: (sql: string) => {
      bind: (...params: unknown[]) => {
        all: <T = unknown>() => Promise<{ results: T[] }>;
        first: <T = unknown>() => Promise<T | null>;
        run: () => Promise<{
          success?: boolean;
          meta?: { last_row_id?: number; changes?: number };
        }>;
      };
    };
    exec: (sql: string) => Promise<unknown>;
  };
  MEDIA?: {
    put: (
      key: string,
      value: ArrayBuffer | Uint8Array,
      options?: { httpMetadata?: { contentType?: string } }
    ) => Promise<unknown>;
    get: (key: string) => Promise<{
      body: ReadableStream | null;
      httpMetadata?: { contentType?: string };
      writeHttpMetadata?: (headers: Headers) => void;
    } | null>;
  };
};

let cachedBindings: CloudflareBindings | null | undefined;

export function getCloudflareBindings(): CloudflareBindings | null {
  if (cachedBindings !== undefined) {
    return cachedBindings;
  }

  try {
    const runtimeRequire = eval("require") as (id: string) => unknown;
    const mod = runtimeRequire("@opennextjs/cloudflare") as {
      getCloudflareContext?: () => { env?: CloudflareBindings };
    };
    cachedBindings = mod.getCloudflareContext?.().env ?? null;
    return cachedBindings;
  } catch {
    cachedBindings = null;
    return null;
  }
}

export function isCloudflareRuntime() {
  return Boolean(getCloudflareBindings());
}

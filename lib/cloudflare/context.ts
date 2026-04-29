type D1PreparedStatement = {
  bind: (...params: unknown[]) => {
    all: <T = unknown>() => Promise<{ results: T[] }>;
    first: <T = unknown>() => Promise<T | null>;
    run: () => Promise<{
      success?: boolean;
      meta?: { last_row_id?: number; changes?: number };
    }>;
  };
};

type D1Session = {
  prepare: (sql: string) => D1PreparedStatement;
};

type CloudflareBindings = {
  DB?: {
    prepare: (sql: string) => D1PreparedStatement;
    exec: (sql: string) => Promise<unknown>;
    withSession?: (constraint?: "first-primary" | "first-unconstrained" | string) => D1Session;
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

type CloudflareContext = {
  env?: CloudflareBindings;
  cf?: unknown;
  ctx?: unknown;
} | null;

let cachedBindings: CloudflareBindings | null | undefined;
let bindingsPromise: Promise<CloudflareBindings | null> | null = null;
let contextPromise: Promise<CloudflareContext> | null = null;

export function getCloudflareBindings(): CloudflareBindings | null {
  if (cachedBindings !== undefined) {
    return cachedBindings;
  }

  return null;
}

export async function getCloudflareBindingsAsync(): Promise<CloudflareBindings | null> {
  if (cachedBindings !== undefined) {
    return cachedBindings;
  }

  if (bindingsPromise) {
    return bindingsPromise;
  }

  bindingsPromise = (async () => {
    const context = await getCloudflareContextAsync();
    cachedBindings = context?.env ?? null;
    return cachedBindings;
  })().finally(() => {
    bindingsPromise = null;
  });

  return bindingsPromise;
}

export async function getCloudflareContextAsync(): Promise<CloudflareContext> {
  if (contextPromise) {
    return contextPromise;
  }

  contextPromise = (async () => {
    try {
      const mod = (await import("@opennextjs/cloudflare")) as {
        getCloudflareContext?: () => Promise<CloudflareContext | undefined>;
      };
      return (await mod.getCloudflareContext?.()) ?? null;
    } catch {
      try {
        const runtimeRequire = eval("require") as (id: string) => unknown;
        const mod = runtimeRequire("@opennextjs/cloudflare") as {
          getCloudflareContext?: () => Promise<CloudflareContext | undefined>;
        };
        return (await mod.getCloudflareContext?.()) ?? null;
      } catch {
        return null;
      }
    } finally {
      contextPromise = null;
    }
  })();

  return contextPromise;
}

export function isCloudflareRuntime() {
  return Boolean(getCloudflareBindings());
}

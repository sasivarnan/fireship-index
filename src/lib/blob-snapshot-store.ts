import { get, put } from "@vercel/blob";
import type { SnapshotStore } from "./feed-service.ts";

const STORE_REQUEST_TIMEOUT_MS = 1500;

async function storeOperation<T>(run: (signal: AbortSignal) => Promise<T>) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error("Feed store request timed out."));
    }, STORE_REQUEST_TIMEOUT_MS);
  });
  try {
    return await Promise.race([run(controller.signal), expired]);
  } finally {
    clearTimeout(timer);
  }
}

export function createBlobSnapshotStore(
  token: string | undefined,
): SnapshotStore {
  function requireToken() {
    if (!token?.trim()) throw new Error("Feed store is not configured.");
    return token;
  }
  const pathname = (key: string) => `feed-snapshots/${key}.json`;
  return {
    async get(key) {
      const credential = requireToken();
      return storeOperation(async (signal) => {
        const blob = await get(pathname(key), {
          access: "private",
          token: credential,
          useCache: false,
          abortSignal: signal,
        });
        if (!blob) return null;
        if (blob.statusCode !== 200)
          throw new Error("Feed store returned no snapshot content.");
        return new Response(blob.stream).json();
      });
    },
    async put(key, value) {
      const credential = requireToken();
      await storeOperation(async (signal) => {
        const blob = await put(pathname(key), value, {
          access: "private",
          token: credential,
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: "application/json",
          abortSignal: signal,
        });
        if (blob.pathname !== pathname(key))
          throw new Error("Feed store did not confirm the snapshot path.");
      });
    },
  };
}

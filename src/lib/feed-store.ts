import { getSecret } from "astro:env/server";
import { getFeed } from "./feed-service.ts";
import { createBlobSnapshotStore } from "./blob-snapshot-store.ts";

export function getStoredFeed() {
  return getFeed(createBlobSnapshotStore(getSecret("BLOB_READ_WRITE_TOKEN")));
}

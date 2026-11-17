import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import { getGlobalDispatcher, MockAgent, setGlobalDispatcher } from "undici";
import { createBlobSnapshotStore } from "../src/lib/blob-snapshot-store.ts";

const token = "vercel_blob_rw_teststore_localtesttoken";
const key = "fireship:feed:v3";
const pathname = `feed-snapshots/${key}.json`;
const readPath = `/${pathname}?cache=0`;
const writePath = `/api/blob/?pathname=${encodeURIComponent(pathname)}`;

function mockStorage(t: TestContext) {
  const previous = getGlobalDispatcher();
  const agent = new MockAgent();
  agent.disableNetConnect();
  setGlobalDispatcher(agent);
  t.after(async () => {
    setGlobalDispatcher(previous);
    await agent.close();
  });
  return {
    reads: agent.get("https://teststore.private.blob.vercel-storage.com"),
    writes: agent.get("https://vercel.com"),
    agent,
  };
}

test("private Blob reads the latest file and overwrites the same snapshot", async (t) => {
  const { reads, writes, agent } = mockStorage(t);
  reads
    .intercept({
      path: readPath,
      method: "GET",
      headers: { authorization: `Bearer ${token}` },
    })
    .reply(404);
  const store = createBlobSnapshotStore(token);
  assert.equal(await store.get(key, "json"), null);
  for (const fetchedAt of [100, 200]) {
    const value = JSON.stringify({ fetchedAt });
    writes
      .intercept({
        path: writePath,
        method: "PUT",
        body: value,
        headers: {
          authorization: `Bearer ${token}`,
          "x-vercel-blob-access": "private",
          "x-add-random-suffix": "0",
          "x-allow-overwrite": "1",
          "x-content-type": "application/json",
        },
      })
      .reply(200, { pathname });
    await store.put(key, value);
    reads.intercept({ path: readPath, method: "GET" }).reply(200, value);
    assert.deepEqual(await store.get(key, "json"), { fetchedAt });
  }
  agent.assertNoPendingInterceptors();
});

test("missing Blob credentials fail before a storage request", async (t) => {
  mockStorage(t);
  for (const token of [undefined, "", " "]) {
    const store = createBlobSnapshotStore(token);
    await assert.rejects(store.get(key, "json"), /not configured/);
    await assert.rejects(store.put(key, "{}"), /not configured/);
  }
});

test("Blob read failures and invalid JSON are not treated as missing snapshots", async (t) => {
  const { reads } = mockStorage(t);
  for (const [status, body] of [
    [403, "Access denied"],
    [304, ""],
    [200, "invalid JSON"],
  ] as const) {
    reads.intercept({ path: readPath, method: "GET" }).reply(status, body);
    await assert.rejects(createBlobSnapshotStore(token).get(key, "json"));
  }
});

test("Blob write failures and wrong file paths cannot report success", async (t) => {
  const { writes } = mockStorage(t);
  writes
    .intercept({ path: writePath, method: "PUT" })
    .reply(403, { error: { code: "forbidden" } });
  await assert.rejects(createBlobSnapshotStore(token).put(key, "{}"));
  writes
    .intercept({ path: writePath, method: "PUT" })
    .reply(200, { pathname: "wrong.json" });
  await assert.rejects(
    createBlobSnapshotStore(token).put(key, "{}"),
    /snapshot path/,
  );
});

test("Blob deadlines bound both reads and writes", async (t) => {
  const { reads, writes } = mockStorage(t);
  reads
    .intercept({ path: readPath, method: "GET" })
    .reply(200, "{}")
    .delay(3000);
  writes
    .intercept({ path: writePath, method: "PUT" })
    .reply(200, { pathname })
    .delay(3000);
  const store = createBlobSnapshotStore(token);
  await Promise.all([
    assert.rejects(store.get(key, "json"), /timed out|aborted/),
    assert.rejects(store.put(key, "{}"), /timed out|aborted/),
  ]);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);

// Execute the real TypeScript modules with isolated network/database boundaries.
function load(file, imports = {}, globals = {}) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require: (name) => name in imports ? imports[name] : require(name),
    console: { error() {}, info() {} },
    Response, AbortSignal,
    ...globals,
  }, { filename: file });
  return exports;
}

const article = { id: "hn-1", title: "AI news", tags: [] };
function route({ hn = async () => [article], arxiv = async () => [], store = async (a) => a.length, secret = "test-secret" } = {}) {
  return load("app/api/ingest/route.ts", {
    "@/lib/sources/hn": { fetchHackerNewsArticles: hn },
    "@/lib/sources/arxiv": { fetchArxivPapers: arxiv },
    "@/lib/db": { storeArticles: store },
  }, { process: { env: { CRON_SECRET: secret } } }).GET;
}
function request(token = "test-secret") {
  return new Request("https://example.test/api/ingest", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

test("missing configuration and unauthorized requests never fetch or store", async () => {
  const forbidden = () => { throw new Error("Must not run"); };
  const get = route({ hn: forbidden, arxiv: forbidden, store: forbidden });
  for (const token of ["", "wrong", "undefined"]) {
    assert.equal((await get(request(token))).status, 401);
  }
  assert.equal((await route({ secret: "", hn: forbidden })(request())).status, 503);
});

test("success reports per-source and actual inserted counts, including duplicates", async () => {
  const get = route({
    arxiv: async (options) => {
      assert.equal(options.throwOnError, true);
      return [{ id: "arxiv-1" }, { id: "arxiv-2" }];
    },
    store: async (articles) => articles[0].id === "hn-1" ? 0 : 2,
  });
  const response = await get(request());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = await response.json();
  assert.equal(body.status, "success");
  assert.equal(body.totalFetched, 3);
  assert.equal(body.totalStored, 2);
  assert.equal(body.sources.hackerNews.stored, 0);
  assert.equal(body.sources.arxiv.stored, 2);
});

test("either failed source leaves the other source ingestible", async () => {
  for (const failed of ["hn", "arxiv"]) {
    const batches = [];
    const response = await route({
      hn: async () => [article],
      arxiv: async () => [{ id: "arxiv-1" }],
      [failed]: async () => { throw new Error("upstream failed"); },
      store: async (articles) => { batches.push(articles); return articles.length; },
    })(request());
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.status, "partial");
    assert.equal(body.totalStored, 1);
    assert.equal(batches.length, 1);
  }
});

test("both fetch failures return 500; storage failure is not reported as success", async () => {
  const fail = async () => { throw new Error("failure"); };
  const response = await route({ hn: fail, arxiv: fail })(request());
  assert.equal(response.status, 500);
  assert.equal((await response.json()).totalStored, 0);
  const partial = await route({
    arxiv: async () => [{ id: "arxiv-1" }],
    store: async (articles) => articles[0].id === "hn-1" ? null : 1,
  })(request());
  const body = await partial.json();
  assert.equal(body.status, "partial");
  assert.equal(body.sources.hackerNews.error, "Failed to store articles");
  assert.equal(body.totalStored, 1);
});

test("storage ignores existing IDs, preserves state and summaries, and counts new rows", async () => {
  const existing = { ...article, saved: true, read: true, summary: "cached", ai_summary: "AI cached" };
  const rows = new Map([[article.id, { ...existing }]]);
  const db = load("lib/db.ts", {
    "@/lib/supabase": { supabase: { from(table) {
      assert.equal(table, "articles");
      return { upsert(batch, options) {
        assert.equal(options.onConflict, "id");
        assert.equal(options.ignoreDuplicates, true);
        return { async select(columns) {
          assert.equal(columns, "id");
          const data = [];
          for (const row of batch) {
            if (!rows.has(row.id)) { rows.set(row.id, row); data.push({ id: row.id }); }
          }
          return { data, error: null };
        } };
      } };
    } } },
  });
  assert.equal(await db.storeArticles([article, { ...article, id: "hn-2" }]), 1);
  assert.equal(await db.storeArticles([article, { ...article, id: "hn-2" }]), 0);
  assert.deepEqual(rows.get(article.id), existing);
  assert.equal(await db.storeArticles([]), 0);
});

test("storage returns null on database errors", async () => {
  const db = load("lib/db.ts", {
    "@/lib/supabase": { supabase: { from: () => ({ upsert: () => ({
      select: async () => ({ data: null, error: { message: "database unavailable" } }),
    }) }) } },
  });
  assert.equal(await db.storeArticles([article]), null);
});

test("source HTTP errors propagate for ingestion while arXiv keeps its feed fallback", async () => {
  const fetch = async (_url, options) => {
    assert.equal(options.next.revalidate, 600);
    assert.ok(options.signal);
    return new Response("unavailable", { status: 503 });
  };
  const hn = load("lib/sources/hn.ts", {}, { fetch });
  await assert.rejects(hn.fetchHackerNewsArticles(), /503/);
  const arxiv = load("lib/sources/arxiv.ts", {}, { fetch });
  await assert.rejects(arxiv.fetchArxivPapers({ throwOnError: true }), /503/);
  assert.equal((await arxiv.fetchArxivPapers()).length, 0);
});

test("malformed arXiv response fails instead of masquerading as an empty success", async () => {
  const arxiv = load("lib/sources/arxiv.ts", {}, {
    fetch: async () => new Response("<html>upstream error</html>"),
  });
  await assert.rejects(arxiv.fetchArxivPapers({ throwOnError: true }), /invalid feed/);
});

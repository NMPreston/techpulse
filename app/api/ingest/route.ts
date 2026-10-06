import { fetchHackerNewsArticles } from "@/lib/sources/hn";
import { fetchArxivPapers } from "@/lib/sources/arxiv";
import { storeArticles } from "@/lib/db";
import type { Article } from "@/lib/types";

export const maxDuration = 60;

async function ingestSource(name: string, fetchArticles: () => Promise<Article[]>) {
  let fetched = 0;
  let stage: "fetch" | "store" = "fetch";
  try {
    const articles = await fetchArticles();
    fetched = articles.length;
    stage = "store";
    const stored = await storeArticles(articles);
    if (stored === null) throw new Error("Database rejected article storage");
    return { status: "success" as const, fetched, stored };
  } catch (error) {
    console.error(`[ingest] ${name} ${stage} failed:`, error);
    return {
      status: "failed" as const,
      fetched,
      stored: 0,
      error: `Failed to ${stage} articles`,
    };
  }
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const headers = { "Cache-Control": "no-store" };
  if (!secret) {
    console.error("[ingest] CRON_SECRET is not configured");
    return Response.json(
      { error: "Ingestion is not configured" },
      { status: 503, headers }
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  }

  const [hackerNews, arxiv] = await Promise.all([
    ingestSource("Hacker News", fetchHackerNewsArticles),
    ingestSource("arXiv", () => fetchArxivPapers({ throwOnError: true })),
  ]);
  const results = [hackerNews, arxiv];
  const successes = results.filter((result) => result.status === "success").length;
  const summary = {
    status: successes === 2 ? "success" : successes === 1 ? "partial" : "failed",
    sources: { hackerNews, arxiv },
    totalFetched: results.reduce((total, result) => total + result.fetched, 0),
    totalStored: results.reduce((total, result) => total + result.stored, 0),
  };
  console.info("[ingest] completed", summary);
  return Response.json(summary, { status: successes === 0 ? 500 : 200, headers });
}

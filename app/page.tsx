import Feed from "@/components/Feed";
import { connection } from "next/server";
import { fetchHackerNewsArticles } from "@/lib/sources/hn";
import { fetchArxivPapers } from "@/lib/sources/arxiv";
import { storeArticles, getArticleState } from "@/lib/db";
import type { Article } from "@/lib/types";

function sortByRecent(articles: Article[]): Article[] {
  return [...articles].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export default async function FeedPage() {
  // Read/save state must be fresh; source fetches retain their own caches.
  await connection();

  const [hnArticles, arxivArticles] = await Promise.all([
    fetchHackerNewsArticles(),
    fetchArxivPapers(),
  ]);

  const liveArticles = [...hnArticles, ...arxivArticles];

  // Persist any new articles (existing rows are left untouched)
  await storeArticles(liveArticles);

  // Pull back saved/read state for what's currently in the feed
  const state = await getArticleState(liveArticles.map((a) => a.id));

  // Merge stored state into the live articles
  const enrich = (a: Article): Article => ({
    ...a,
    saved: state[a.id]?.saved ?? false,
    read: state[a.id]?.read ?? false,
    aiSummary: state[a.id]?.aiSummary,
  });

  const sections = [
    {
      label: "Hacker News",
      color: "#E8A838",
      articles: sortByRecent(hnArticles).map(enrich),
    },
    {
      label: "arXiv Research",
      color: "#38E8A8",
      articles: sortByRecent(arxivArticles).map(enrich),
    },
  ];

  return <Feed sections={sections} />;
}

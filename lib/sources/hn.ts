import type { HNStory, Article } from "@/lib/types";

const HN_BASE = "https://hacker-news.firebaseio.com/v0";

const KEYWORDS = [
  "ai", "ml", "machine learning", "llm", "gpt", "claude", "openai", "anthropic",
  "neural", "transformer", "model", "training", "inference",
  "patent", "uspto", "ipr", "trademark", "copyright",
  "security", "cve", "vulnerability", "encryption",
  "nvidia", "tsmc", "chip", "semiconductor",
];

function isRelevant(title: string): boolean {
  const lower = title.toLowerCase();
  return KEYWORDS.some((kw) => lower.includes(kw));
}

function extractTags(title: string): string[] {
  const lower = title.toLowerCase();
  return KEYWORDS.filter((kw) => lower.includes(kw)).slice(0, 4);
}

export async function fetchHackerNewsArticles(): Promise<Article[]> {
  const topRes = await fetch(`${HN_BASE}/topstories.json`, {
    next: { revalidate: 600 },
  });
  const ids: number[] = await topRes.json();

  const storyPromises = ids.slice(0, 50).map((id) =>
    fetch(`${HN_BASE}/item/${id}.json`, { next: { revalidate: 600 } }).then(
      (r) => r.json() as Promise<HNStory>
    )
  );
  const stories = await Promise.all(storyPromises);

  return stories
    .filter((s) => s && s.title && s.type === "story")
    .filter((s) => isRelevant(s.title))
    .map((s) => ({
      id: `hn-${s.id}`,
      title: s.title,
      url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
      source: "Hacker News",
      score: s.score,
      author: s.by,
      publishedAt: new Date(s.time * 1000).toISOString(),
      commentCount: s.descendants || 0,
      tags: extractTags(s.title),
    }));
}
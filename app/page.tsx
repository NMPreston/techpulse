import ArticleCard from "@/components/ArticleCard";
import { fetchHackerNewsArticles } from "@/lib/sources/hn";
import { fetchArxivPapers } from "@/lib/sources/arxiv";
import type { Article } from "@/lib/types";

export const revalidate = 600;

function sortByRecent(articles: Article[]): Article[] {
  return [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export default async function FeedPage() {
  const [hnArticles, arxivArticles] = await Promise.all([
    fetchHackerNewsArticles(),
    fetchArxivPapers(),
  ]);

  const totalCount = hnArticles.length + arxivArticles.length;

  const sections = [
    { label: "Hacker News", color: "#E8A838", articles: sortByRecent(hnArticles) },
    { label: "arXiv Research", color: "#38E8A8", articles: sortByRecent(arxivArticles) },
  ];

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Feed</h2>
        <span className="text-xs text-zinc-600 font-mono">
          {totalCount} articles
        </span>
      </div>

      {totalCount === 0 ? (
        <p className="text-sm text-zinc-500">
          No articles found. Sources might be having issues — try refreshing.
        </p>
      ) : (
        <div className="space-y-8">
          {sections.map((section) =>
            section.articles.length > 0 ? (
              <div key={section.label}>
                <div
                  className="text-xs font-semibold uppercase tracking-wider font-mono mb-3"
                  style={{ color: section.color }}
                >
                  {section.label} ({section.articles.length})
                </div>
                <div>
                  {section.articles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
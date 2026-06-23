import ArticleCard from "@/components/ArticleCard";
import type { Article } from "@/lib/types";

async function getArticles(): Promise<Article[]> {
  // In production, use the Vercel URL; locally, use localhost
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/feed/hn`, {
    next: { revalidate: 600 },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.articles || [];
}

export default async function FeedPage() {
  const articles = await getArticles();

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Feed</h2>
        <span className="text-xs text-zinc-600 font-mono">
          {articles.length} articles
        </span>
      </div>

      {articles.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No articles found. The API might be having issues — try refreshing.
        </p>
      ) : (
        <div>
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
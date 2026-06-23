import ArticleCard from "@/components/ArticleCard";
import { fetchHackerNewsArticles } from "@/lib/sources/hn";

export const revalidate = 600; // Re-fetch every 10 minutes

export default async function FeedPage() {
  const articles = await fetchHackerNewsArticles();

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
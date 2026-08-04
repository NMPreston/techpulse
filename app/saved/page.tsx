import ArticleCard from "@/components/ArticleCard";
import { getSavedArticles } from "@/lib/db";

export const revalidate = 0;

export default async function SavedPage() {
  const articles = await getSavedArticles();

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Saved</h2>
        <span className="text-xs text-zinc-600 font-mono">
          {articles.length} saved
        </span>
      </div>

      {articles.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Nothing saved yet. Tap the ☆ on any article to save it here.
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
"use client";

import { useSearchParams } from "next/navigation";
import ArticleCard from "@/components/ArticleCard";
import type { Article } from "@/lib/types";

interface FeedSection {
  label: string;
  color: string;
  articles: Article[];
}

export default function Feed({ sections }: { sections: FeedSection[] }) {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter") === "unread" ? "Unread" : "All";

  function setFilter(option: "All" | "Unread") {
    const url = new URL(window.location.href);
    if (option === "Unread") {
      url.searchParams.set("filter", "unread");
    } else {
      url.searchParams.delete("filter");
    }
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }

  const isVisible = (article: Article) =>
    filter === "All" || article.read === false;
  const totalCount = sections.reduce(
    (count, section) => count + section.articles.length,
    0
  );
  const visibleCount = sections.reduce(
    (count, section) => count + section.articles.filter(isVisible).length,
    0
  );

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Feed</h2>
        <span className="text-xs text-zinc-600 font-mono">
          {visibleCount} articles
        </span>
      </div>

      <div
        role="group"
        aria-label="Filter articles"
        className="mb-4 inline-flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1"
      >
        {(["All", "Unread"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={filter === option}
            onClick={() => setFilter(option)}
            className={`rounded-lg px-3 py-1.5 font-mono text-xs transition-colors ${
              filter === option
                ? "bg-zinc-800 text-amber-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {visibleCount === 0 && (
        <p className="text-sm text-zinc-500">
          {totalCount === 0
            ? "No articles found. Sources might be having issues — try refreshing."
            : "No unread articles."}
        </p>
      )}

      <div className="space-y-8">
        {sections.map((section) => {
          const count = section.articles.filter(isVisible).length;

          return (
            <div key={section.label} hidden={count === 0}>
              <div
                className="text-xs font-semibold uppercase tracking-wider font-mono mb-3"
                style={{ color: section.color }}
              >
                {section.label} ({count})
              </div>
              <div>
                {section.articles.map((article) => (
                  <div key={article.id} hidden={!isVisible(article)}>
                    <ArticleCard article={article} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

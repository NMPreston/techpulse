import type { Article } from "@/lib/types";

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-2 hover:border-zinc-700 transition-colors"
    >
      <h3 className="text-sm font-semibold text-white leading-snug mb-1">
        {article.title}
      </h3>
      <div className="flex gap-2 items-center text-xs text-zinc-500 font-mono mt-2">
        <span>{article.source}</span>
        <span>·</span>
        <span>{timeAgo(article.publishedAt)}</span>
        <span>·</span>
        <span>{article.score} pts</span>
        <span>·</span>
        <span>{article.commentCount} comments</span>
      </div>
      {article.tags.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </a>
  );
}
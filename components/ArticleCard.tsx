"use client";

import { useState } from "react";
import type { Article } from "@/lib/types";

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function ArticleCard({ article }: { article: Article }) {
  const [expanded, setExpanded] = useState(false);
  const [preview, setPreview] = useState<string | null>(article.summary || null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(!!article.summary);

  const isArxiv = article.source === "arXiv";

  async function handleToggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && !fetched && !isArxiv) {
      setLoading(true);
      try {
        const res = await fetch(`/api/preview?url=${encodeURIComponent(article.url)}`);
        const data = await res.json();
        setPreview(data.description || null);
      } catch {
        setPreview(null);
      }
      setLoading(false);
      setFetched(true);
    }
  }

  const cardStyle = "bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-2 hover:border-zinc-700 transition-colors";
  const linkStyle = "inline-block mt-3 text-xs text-amber-500 hover:text-amber-400 font-mono";

  return (
    <div className={cardStyle}>
      <button onClick={handleToggle} className="w-full text-left">
        <h3 className="text-sm font-semibold text-white leading-snug mb-1">{article.title}</h3>
        <div className="flex gap-2 items-center text-xs text-zinc-500 font-mono mt-2">
          <span>{article.source}</span>
          <span>·</span>
          <span>{timeAgo(article.publishedAt)}</span>
          {!isArxiv ? <span>· {article.score} pts · {article.commentCount} comments</span> : null}
        </div>
        {article.tags.length > 0 ? (
          <div className="flex gap-1 mt-2 flex-wrap">
            {article.tags.map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">{tag}</span>
            ))}
          </div>
        ) : null}
      </button>

      {expanded ? (
        <div className="mt-3 pt-3 border-t border-zinc-800">
          {loading ? <p className="text-sm text-zinc-500 animate-pulse">Loading preview…</p> : null}
          {!loading && preview ? <p className="text-sm text-zinc-400 leading-relaxed">{preview}</p> : null}
          {!loading && !preview ? <p className="text-sm text-zinc-600 italic">No preview available for this source.</p> : null}
          <a href={article.url} target="_blank" rel="noopener noreferrer" className={linkStyle}>Read original →</a>
        </div>
      ) : null}
    </div>
  );
}
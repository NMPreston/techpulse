"use client";

import { useState, type MouseEvent } from "react";
import type { Article } from "@/lib/types";

function timeAgo(iso: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(iso).getTime()) / 1000
  );

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;

  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function ArticleCard({
  article,
}: {
  article: Article;
}) {
  const [expanded, setExpanded] = useState(false);
  const [preview, setPreview] = useState<string | null>(
    article.summary || null
  );
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(Boolean(article.summary));
  const [saved, setSaved] = useState(Boolean(article.saved));
  const [savingBusy, setSavingBusy] = useState(false);

  const isArxiv = article.source === "arXiv";

  async function handleToggle() {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);

    if (nextExpanded && !fetched && !isArxiv) {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/preview?url=${encodeURIComponent(article.url)}`
        );

        if (!response.ok) {
          throw new Error(`Preview request failed: ${response.status}`);
        }

        const data: { description?: string } = await response.json();
        setPreview(data.description || null);
      } catch (error) {
        console.error("Failed to load article preview:", error);
        setPreview(null);
      } finally {
        setLoading(false);
        setFetched(true);
      }
    }
  }

  async function handleSave(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    const nextSaved = !saved;
    setSaved(nextSaved);
    setSavingBusy(true);

    try {
      const response = await fetch("/api/articles/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: article.id,
          saved: nextSaved,
        }),
      });

      if (!response.ok) {
        throw new Error(`Save request failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to update saved article:", error);
      setSaved(!nextSaved);
    } finally {
      setSavingBusy(false);
    }
  }

  const starLabel = saved ? "Unsave" : "Save";
  const starChar = saved ? "\u2605" : "\u2606";

  return (
    <article className="mb-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={expanded}
          className="flex-1 text-left"
        >
          <h3 className="mb-1 text-sm font-semibold leading-snug text-white">
            {article.title}
          </h3>

          <div className="mt-2 flex items-center gap-2 font-mono text-xs text-zinc-500">
            <span>{article.source}</span>
            <span>·</span>
            <span>{timeAgo(article.publishedAt)}</span>

            {!isArxiv ? (
              <>
                <span>·</span>
                <span>{article.score} pts</span>
                <span>·</span>
                <span>{article.commentCount} comments</span>
              </>
            ) : null}
          </div>

          {article.tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={savingBusy}
          aria-label={starLabel}
          className={
            saved
              ? "shrink-0 text-lg leading-none text-amber-400 disabled:opacity-50"
              : "shrink-0 text-lg leading-none text-zinc-600 hover:text-zinc-400 disabled:opacity-50"
          }
        >
          {starChar}
        </button>
      </div>

      {expanded ? (
        <div className="mt-3 border-t border-zinc-800 pt-3">
          {loading ? (
            <p className="animate-pulse text-sm text-zinc-500">
              Loading preview...
            </p>
          ) : preview ? (
            <p className="text-sm leading-relaxed text-zinc-400">
              {preview}
            </p>
          ) : (
            <p className="text-sm italic text-zinc-600">
              No preview available for this source.
            </p>
          )}

          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block font-mono text-xs text-amber-500 hover:text-amber-400"
          >
            Read original ↗
          </a>
        </div>
      ) : null}
    </article>
  );
}
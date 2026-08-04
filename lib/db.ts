import { supabase } from "@/lib/supabase";
import type { Article } from "@/lib/types";

interface ArticleRow {
  id: string;
  title: string;
  url: string;
  source: string;
  score: number | null;
  author: string | null;
  published_at: string;
  comment_count: number | null;
  tags: string[] | null;
  summary: string | null;
  ai_summary: string | null;
  saved: boolean | null;
  read: boolean | null;
}

// Convert our Article shape into a database row.
function toRow(article: Article) {
  return {
    id: article.id,
    title: article.title,
    url: article.url,
    source: article.source,
    score: article.score,
    author: article.author,
    published_at: article.publishedAt,
    comment_count: article.commentCount,
    tags: article.tags,
    summary: article.summary ?? null,
  };
}

// Convert a database row back into our Article shape.
function fromRow(row: ArticleRow): Article {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    source: row.source,
    score: row.score ?? 0,
    author: row.author ?? "",
    publishedAt: row.published_at,
    commentCount: row.comment_count ?? 0,
    tags: row.tags ?? [],
    summary: row.summary ?? undefined,
    aiSummary: row.ai_summary ?? undefined,
    saved: row.saved ?? false,
    read: row.read ?? false,
  };
}

// Insert new articles while preserving saved/read state and cached summaries.
export async function storeArticles(
  articles: Article[]
): Promise<void> {
  if (articles.length === 0) return;

  const rows = articles.map(toRow);

  const { error } = await supabase
    .from("articles")
    .upsert(rows, {
      onConflict: "id",
      ignoreDuplicates: true,
    });

  if (error) {
    console.error("storeArticles error:", error);
  }
}

// Fetch stored state for a collection of article IDs.
export async function getArticleState(
  ids: string[]
): Promise<
  Record<
    string,
    {
      saved: boolean;
      read: boolean;
      aiSummary?: string;
    }
  >
> {
  if (ids.length === 0) return {};

  const { data, error } = await supabase
    .from("articles")
    .select("id, saved, read, ai_summary")
    .in("id", ids);

  if (error) {
    console.error("getArticleState error:", error);
    return {};
  }

  const stateMap: Record<
    string,
    {
      saved: boolean;
      read: boolean;
      aiSummary?: string;
    }
  > = {};

  for (const row of data ?? []) {
    stateMap[row.id] = {
      saved: row.saved ?? false,
      read: row.read ?? false,
      aiSummary: row.ai_summary ?? undefined,
    };
  }

  return stateMap;
}

// Fetch all saved articles for the Saved page.
export async function getSavedArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("saved", true)
    .order("published_at", { ascending: false });

  if (error) {
    console.error("getSavedArticles error:", error);
    return [];
  }

  return (data ?? []).map((row) => fromRow(row as ArticleRow));
}

// Toggle the saved state for one article.
export async function setSaved(
  id: string,
  saved: boolean
): Promise<void> {
  const { error } = await supabase
    .from("articles")
    .update({ saved })
    .eq("id", id);

  if (error) {
    console.error("setSaved error:", error);
  }
}
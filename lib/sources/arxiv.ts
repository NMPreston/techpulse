import { XMLParser } from "fast-xml-parser";
import type { Article, ArxivEntry } from "@/lib/types";

const ARXIV_API = "http://export.arxiv.org/api/query";

const CATEGORIES = ["cs.AI", "cs.LG", "cs.CR", "cs.CL"];

function buildQuery(): string {
  const catQuery = CATEGORIES.map((c) => `cat:${c}`).join("+OR+");
  // Build manually — URLSearchParams would re-encode the +OR+ operators
  return `${ARXIV_API}?search_query=${catQuery}&sortBy=submittedDate&sortOrder=descending&max_results=20`;
}

function getLink(entry: ArxivEntry): string {
  if (Array.isArray(entry.link)) {
    const alt = entry.link.find((l) => l["@_rel"] === "alternate");
    return alt?.["@_href"] || entry.link[0]["@_href"];
  }
  return entry.link["@_href"];
}

function getAuthors(entry: ArxivEntry): string {
  if (Array.isArray(entry.author)) {
    const names = entry.author.map((a) => a.name);
    if (names.length <= 2) return names.join(", ");
    return `${names[0]} et al.`;
  }
  return entry.author.name;
}

function getCategoryTags(entry: ArxivEntry): string[] {
  if (Array.isArray(entry.category)) {
    return entry.category.map((c) => c["@_term"]).slice(0, 4);
  }
  return [entry.category["@_term"]];
}

export async function fetchArxivPapers(): Promise<Article[]> {
  try {
    const url = buildQuery();
    const res = await fetch(url, {
      next: { revalidate: 600 },
      headers: { "User-Agent": "TechPulse/1.0 (personal project)" },
    });

    const xml = await res.text();

    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml);

    const entries = parsed?.feed?.entry;
    if (!entries) {
      return [];
    }

    const entryList: ArxivEntry[] = Array.isArray(entries) ? entries : [entries];

    return entryList.map((entry) => ({
      id: `arxiv-${String(entry.id).split("/abs/")[1] || entry.id}`,
      title: String(entry.title).replace(/\s+/g, " ").trim(),
      url: getLink(entry),
      source: "arXiv",
      score: 0,
      author: getAuthors(entry),
      publishedAt: entry.published,
      commentCount: 0,
      tags: getCategoryTags(entry),
    }));
  } catch (error) {
    console.error("arXiv fetch error:", error);
    return [];
  }
}
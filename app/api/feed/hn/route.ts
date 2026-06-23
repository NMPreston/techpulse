import { NextResponse } from "next/server";
import { fetchHackerNewsArticles } from "@/lib/sources/hn";

export async function GET() {
  try {
    const articles = await fetchHackerNewsArticles();
    return NextResponse.json({ articles });
  } catch (error) {
    console.error("HN fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Hacker News" },
      { status: 500 }
    );
  }
}
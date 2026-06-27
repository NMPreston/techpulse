import { NextRequest, NextResponse } from "next/server";

// Extract a meta tag's content from raw HTML
function extractMeta(html: string, property: string): string | null {
  // Try property="og:..." format
  const propRegex = new RegExp(
    `<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`,
    "i"
  );
  // Try name="..." format (some sites use name instead of property)
  const nameRegex = new RegExp(
    `<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`,
    "i"
  );
  // Try content-first ordering (content comes before property)
  const reverseRegex = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`,
    "i"
  );

  const match =
    html.match(propRegex) || html.match(nameRegex) || html.match(reverseRegex);
  return match ? match[1] : null;
}

// Decode common HTML entities so previews read cleanly
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "No URL provided" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; TechPulse/1.0; +personal-project)",
      },
      next: { revalidate: 3600 }, // cache previews for 1 hour
      signal: AbortSignal.timeout(5000), // give up after 5 seconds
    });

    if (!res.ok) {
      return NextResponse.json(
        { description: null, error: `Source returned ${res.status}` },
        { status: 200 }
      );
    }

    const html = await res.text();

    const description =
      extractMeta(html, "og:description") ||
      extractMeta(html, "description") ||
      extractMeta(html, "twitter:description");

    const image = extractMeta(html, "og:image");
    const siteName = extractMeta(html, "og:site_name");

    return NextResponse.json({
      description: description ? decodeEntities(description) : null,
      image,
      siteName,
    });
  } catch (error) {
    console.error("Preview fetch error:", error);
    return NextResponse.json(
      { description: null, error: "Failed to fetch preview" },
      { status: 200 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { setSaved } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { id, saved } = await request.json();
    if (typeof id !== "string" || typeof saved !== "boolean") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    await setSaved(id, saved);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("save route error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { setRead } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { id, read } = await request.json();

    if (typeof id !== "string" || typeof read !== "boolean") {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    await setRead(id, read);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("read route error:", error);

    return NextResponse.json(
      { error: "Failed to update read state" },
      { status: 500 }
    );
  }
}
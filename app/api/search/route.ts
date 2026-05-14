import { NextResponse } from "next/server";
import { searchSessions } from "@/lib/parser";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const baseDir = searchParams.get("baseDir") || undefined;

  if (!q || q.trim().length === 0) {
    return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
  }

  const results = searchSessions(baseDir, q);
  return NextResponse.json({ results });
}

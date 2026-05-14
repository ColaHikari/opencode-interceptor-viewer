import { NextResponse } from "next/server";
import { parseSession, listSessionDirs } from "@/lib/parser";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const baseDir = searchParams.get("baseDir") || undefined;

  const dirs = listSessionDirs(baseDir);
  const sessionDir = dirs.find((d) => d.endsWith(id));

  if (!sessionDir) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const session = parseSession(sessionDir);
  if (!session) {
    return NextResponse.json({ error: "Failed to parse session" }, { status: 500 });
  }

  return NextResponse.json(session);
}

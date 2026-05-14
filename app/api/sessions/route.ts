import { NextResponse } from "next/server";
import { listSessionDirs, getSessionSummary } from "@/lib/parser";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const baseDir = searchParams.get("baseDir") || undefined;

  const dirs = listSessionDirs(baseDir);
  const sessions = dirs
    .map((dir) => getSessionSummary(dir))
    .filter((s): s is NonNullable<typeof s> => s !== null);

  return NextResponse.json({ sessions });
}

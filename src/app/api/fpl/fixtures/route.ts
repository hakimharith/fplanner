import { NextResponse } from "next/server";

export const revalidate = 3600;

export async function GET() {
  const res = await fetch(
    "https://fantasy.premierleague.com/api/fixtures/",
    { next: { revalidate: 3600 }, headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" } }
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch FPL fixtures" },
      { status: 502 }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}

import { NextResponse } from "next/server";

export const revalidate = 3600; // cache for 1 hour

export async function GET() {
  const res = await fetch(
    "https://fantasy.premierleague.com/api/bootstrap-static/",
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch FPL bootstrap data" },
      { status: 502 }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}

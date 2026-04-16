import { NextResponse } from "next/server";
import { FPL_HEADERS } from "../headers";

export const revalidate = 3600;

export async function GET() {
  const res = await fetch(
    "https://fantasy.premierleague.com/api/fixtures/",
    { next: { revalidate: 3600 }, headers: FPL_HEADERS }
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

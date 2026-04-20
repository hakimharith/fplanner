import { NextResponse } from "next/server";
import { FPL_HEADERS } from "../../headers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;
  const res = await fetch(
    `https://fantasy.premierleague.com/api/element-summary/${playerId}/`,
    { next: { revalidate: 3600 }, headers: FPL_HEADERS }
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: `Player summary not found for player ${playerId}` },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}

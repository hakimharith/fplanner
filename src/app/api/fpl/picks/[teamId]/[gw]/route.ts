import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ teamId: string; gw: string }> }
) {
  const { teamId, gw } = await params;
  const res = await fetch(
    `https://fantasy.premierleague.com/api/entry/${teamId}/event/${gw}/picks/`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: `Picks not found for team ${teamId} GW${gw}` },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}

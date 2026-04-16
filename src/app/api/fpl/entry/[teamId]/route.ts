import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const res = await fetch(
    `https://fantasy.premierleague.com/api/entry/${teamId}/`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: `Team ${teamId} not found` },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}

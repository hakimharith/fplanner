import { NextResponse } from "next/server";
import { buildSquadRows, getPlayerSummary } from "@/lib/fpl";
import type { BacktestReport, BacktestPlayerResult } from "@/types/fpl";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;

  // Reuse the existing data pipeline to get current IN recommendations
  const { transferIns, currentGw } = await buildSquadRows(teamId);

  // Top 5 IN recommendations
  const top5 = transferIns.slice(0, 5);

  // Last 5 completed GWs (working backwards from currentGw)
  const gwNumbers: number[] = [];
  for (let i = 4; i >= 0; i--) {
    const gw = currentGw - i;
    if (gw >= 1) gwNumbers.push(gw);
  }

  // Fetch GW-by-GW history for each recommended player
  const players: BacktestPlayerResult[] = await Promise.all(
    top5.map(async (p) => {
      let gwPoints: { gw: number; points: number | null }[] = gwNumbers.map((gw) => ({
        gw,
        points: null,
      }));

      try {
        const summary = await getPlayerSummary(p.id);
        gwPoints = gwNumbers.map((gw) => {
          const entry = summary.history.find((h) => h.round === gw);
          return { gw, points: entry !== undefined ? entry.total_points : null };
        });
      } catch {
        // leave as null — player summary unavailable
      }

      const validGws = gwPoints.filter((g) => g.points !== null);
      const hits = validGws.filter((g) => (g.points ?? 0) > 2).length;
      const hitRate = validGws.length > 0 ? hits / validGws.length : 0;

      return {
        id: p.id,
        name: p.name,
        teamShort: p.teamShort,
        position: p.position,
        score: p.score,
        gwPoints,
        hitRate,
      };
    })
  );

  const allHits = players.flatMap((p) =>
    p.gwPoints.filter((g) => g.points !== null && g.points > 2)
  );
  const allValid = players.flatMap((p) => p.gwPoints.filter((g) => g.points !== null));
  const seasonHitRate = allValid.length > 0 ? allHits.length / allValid.length : 0;

  const report: BacktestReport = { players, gwNumbers, seasonHitRate };
  return NextResponse.json(report);
}

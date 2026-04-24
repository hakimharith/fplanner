import type {
  FplBootstrap,
  FplFixture,
  FplPicks,
  FplEntryInfo,
  FplPlayer,
  FplTeam,
  FplPlayerSummary,
  GwFixtureSlot,
  SquadPlayerRow,
  PlayerFixtureCell,
  CaptainSuggestion,
  TransferPlayer,
  TransferOutCandidate,
  TransferInCandidate,
  FplPlayerPool,
} from "@/types/fpl";

// Call FPL directly from the server — no self-loop through our own proxy routes.
// The proxy routes in /api/fpl/* still exist for browser-side CORS compliance.
const FPL_BASE = "https://fantasy.premierleague.com/api";

const FPL_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-GB,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Referer": "https://fantasy.premierleague.com/",
  "Origin": "https://fantasy.premierleague.com",
};

async function fetchFpl<T>(path: string, revalidate: number): Promise<T> {
  const res = await fetch(`${FPL_BASE}${path}`, {
    headers: FPL_HEADERS,
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`FPL API failed: ${path} — ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getBootstrap(): Promise<FplBootstrap> {
  return fetchFpl<FplBootstrap>("/bootstrap-static/", 3600);
}

export async function getFixtures(): Promise<FplFixture[]> {
  return fetchFpl<FplFixture[]>("/fixtures/", 3600);
}

export async function getEntryInfo(teamId: string): Promise<FplEntryInfo> {
  return fetchFpl<FplEntryInfo>(`/entry/${teamId}/`, 60);
}

export async function getPicks(teamId: string, gw: number): Promise<FplPicks> {
  return fetchFpl<FplPicks>(`/entry/${teamId}/event/${gw}/picks/`, 60);
}

export async function getPlayerSummary(playerId: number): Promise<FplPlayerSummary> {
  return fetchFpl<FplPlayerSummary>(`/element-summary/${playerId}/`, 3600);
}

// ── Transfer recommendation helpers ──────────────────────────────────────────

type FixtureEntry = { opponentId: number; isHome: boolean; fdr: number };

/** Simple average FDR for a player over the given GWs. BGW = 5.0. */
function avgFdrForPlayer(
  teamId: number,
  fixtureMap: Map<number, Map<number, FixtureEntry[]>>,
  gwsToCheck: number[]
): number {
  const gwMap = fixtureMap.get(teamId);
  if (!gwMap) return 5;
  let total = 0, count = 0;
  for (const gw of gwsToCheck) {
    const entries = gwMap.get(gw) ?? [];
    if (entries.length === 0) { total += 5; count++; } // BGW = worst
    else { for (const e of entries) { total += e.fdr; count++; } }
  }
  return count > 0 ? total / count : 5;
}

function nextFixturesForPlayer(
  teamId: number,
  fixtureMap: Map<number, Map<number, FixtureEntry[]>>,
  teamMap: Map<number, FplTeam>,
  gwsToCheck: number[]
): { opponentShort: string; isHome: boolean; fdr: number }[] {
  const gwMap = fixtureMap.get(teamId);
  if (!gwMap) return [];
  const result: { opponentShort: string; isHome: boolean; fdr: number }[] = [];
  for (const gw of gwsToCheck) {
    for (const e of gwMap.get(gw) ?? []) {
      result.push({ opponentShort: teamMap.get(e.opponentId)?.short_name ?? "?", isHome: e.isHome, fdr: e.fdr });
    }
    if (result.length >= 3) break;
  }
  return result;
}

/** Per-GW fixture list for a player over the given GWs. Empty array = BGW. */
function gwFixturesForPlayer(
  teamId: number,
  fixtureMap: Map<number, Map<number, FixtureEntry[]>>,
  teamMap: Map<number, FplTeam>,
  gwsToCheck: number[]
): GwFixtureSlot[] {
  const gwMap = fixtureMap.get(teamId);
  return gwsToCheck.map((gw) => ({
    gw,
    fixtures: (gwMap?.get(gw) ?? []).map((e) => ({
      opponentShort: teamMap.get(e.opponentId)?.short_name ?? "?",
      isHome: e.isHome,
      fdr: e.fdr,
    })),
  }));
}

/** Clamp a value to [0, 1]. */
function clamp01(v: number): number { return Math.max(0, Math.min(1, v)); }

// ── Improvement constants ─────────────────────────────────────────────────────

/** GW+1 / GW+2 / GW+3 weights for the IN score FDR component. */
const FDR_WEIGHTS = [0.5, 0.3, 0.2];

/** ICT sub-component season-total caps (calibrated for mid-to-late season). */
const ICT_INFLUENCE_CAP = 300;
const ICT_CREATIVITY_CAP = 400;
const ICT_THREAT_CAP = 600;

/** FDR → form adjustment multiplier (Improvement 3: opponent-adjusted form). */
const FDR_FORM_WEIGHT: Record<number, number> = { 1: 0.7, 2: 0.85, 3: 1.0, 4: 1.15, 5: 1.3 };

/**
 * GW-weighted FDR for the IN score.
 * GW+1 = 50%, GW+2 = 30%, GW+3 = 20%. BGW = 5 (worst). Also returns
 * whether GW+1 is a blank (to cap the FDR score).
 */
function weightedFdrForPlayer(
  teamId: number,
  fixtureMap: Map<number, Map<number, FixtureEntry[]>>,
  gwsToCheck: number[]
): { weightedAvg: number; hasBlankGw1: boolean } {
  const gwMap = fixtureMap.get(teamId);
  if (!gwMap) return { weightedAvg: 5, hasBlankGw1: true };

  let weightedSum = 0;
  for (let i = 0; i < gwsToCheck.length; i++) {
    const gw = gwsToCheck[i];
    const w = FDR_WEIGHTS[i] ?? 0;
    const entries = gwMap.get(gw) ?? [];
    if (entries.length === 0) {
      weightedSum += 5 * w; // BGW = worst
    } else {
      const avgGwFdr = entries.reduce((s, e) => s + e.fdr, 0) / entries.length;
      weightedSum += avgGwFdr * w;
    }
  }

  const hasBlankGw1 = (gwMap.get(gwsToCheck[0]) ?? []).length === 0;
  return { weightedAvg: weightedSum, hasBlankGw1 };
}

/**
 * Fetch player history for the given IDs.
 * Returns:
 *   adjustedFormMap — opponent-weighted form average (for IN scoring)
 *   gwPointsMap     — actual points per GW for display (null = no data)
 */
async function fetchHistoryData(
  playerIds: number[],
  playerTeamMap: Map<number, number>,
  fixtureMap: Map<number, Map<number, FixtureEntry[]>>,
  last5Gws: number[]
): Promise<{
  adjustedFormMap: Map<number, number>;
  gwPointsMap: Map<number, (number | null)[]>;
}> {
  const adjustedFormMap = new Map<number, number>();
  const gwPointsMap = new Map<number, (number | null)[]>();

  await Promise.all(
    playerIds.map(async (id) => {
      try {
        const summary = await getPlayerSummary(id);

        // Per-GW points for display
        const pts: (number | null)[] = last5Gws.map((gw) => {
          const entry = summary.history.find((h) => h.round === gw);
          return entry !== undefined ? entry.total_points : null;
        });
        gwPointsMap.set(id, pts);

        // Opponent-adjusted form
        const recent = summary.history.filter((h) => last5Gws.includes(h.round));
        if (recent.length === 0) return;

        let totalWeighted = 0;
        for (const entry of recent) {
          const teamId = playerTeamMap.get(id);
          const gwFixtures = teamId ? (fixtureMap.get(teamId)?.get(entry.round) ?? []) : [];
          const fdr = gwFixtures[0]?.fdr ?? 3;
          const w = FDR_FORM_WEIGHT[fdr] ?? 1.0;
          totalWeighted += entry.total_points * w;
        }
        adjustedFormMap.set(id, totalWeighted / recent.length);
      } catch {
        // fall back to raw form; gwPointsMap entry absent
      }
    })
  );

  return { adjustedFormMap, gwPointsMap };
}

/**
 * Compute OUT score (0–100) for a squad player.
 * Higher = stronger case to transfer out.
 */
function computeOutScore(
  player: FplPlayer,
  fixtureMap: Map<number, Map<number, FixtureEntry[]>>,
  next3Gws: number[]
): number {
  const pos = player.element_type; // 1=GK 2=DEF 3=MID 4=FWD
  const form = parseFloat(player.form) || 0;
  const xgi90 = player.expected_goal_involvements_per_90 ?? 0;
  const xgc90 = player.expected_goals_conceded_per_90 ?? 1.5;
  const defContrib90 = player.defensive_contribution_per_90 ?? 0;
  const starts = player.starts ?? 0;
  const minutes = player.minutes ?? 0;
  const goals = player.goals_scored ?? 0;
  const xg = parseFloat(player.expected_goals) || 0;
  const cop = player.chance_of_playing_next_round; // null | 0|25|50|75|100
  const avgFdr = avgFdrForPlayer(player.team, fixtureMap, next3Gws);

  // 1. FDR component (35 pts max) — bad fixtures = high score
  const fdrScore = clamp01((avgFdr - 1) / 4) * 35;

  // 2. Form component (20 pts max) — low form = high score
  const formScore = clamp01((6 - form) / 6) * 20;

  // 3. Quality component (15 pts max) — position-specific
  let qualityScore: number;
  if (pos === 1 || pos === 2) {
    // DEF/GK: penalise high xGC and low defensive contribution
    const xgcComponent = clamp01((xgc90 - 0.8) / 1.2) * 8; // high xGC = bad
    const defComponent = clamp01((0.5 - defContrib90) / 0.5) * 7; // low def = bad
    qualityScore = xgcComponent + defComponent;
  } else {
    // MID/FWD: penalise low xGI/90
    qualityScore = clamp01((0.45 - xgi90) / 0.45) * 15;
  }

  // 4. Availability penalty (15 pts max)
  let availScore = 0;
  if (cop !== null && cop !== undefined) {
    if (cop <= 0)  availScore = 15;
    else if (cop === 25) availScore = 14;
    else if (cop === 50) availScore = 12;
    else if (cop === 75) availScore = 8;
  }

  // 5. Form vs season PPG divergence (8 pts max) — falling off cliff
  const seasonPPG = starts > 0 ? player.total_points / starts : 0;
  const divergenceScore = clamp01(Math.max(0, seasonPPG - form) / 6) * 8;

  // 6. Goals >> xG regression risk (7 pts max)
  const xgDiff = goals - xg;
  const regressionScore = clamp01(Math.max(0, xgDiff - 2) / 5) * 7;
  // Only apply to attackers (pos 3/4)
  const regressionFinal = (pos === 3 || pos === 4) ? regressionScore : 0;

  // suppress unused variable warning
  void minutes;

  return fdrScore + formScore + qualityScore + availScore + divergenceScore + regressionFinal;
}

/**
 * Compute IN score (0–100) for a candidate player.
 * Higher = better pickup.
 *
 * Improvements over v1:
 *   1. GW-weighted FDR (GW+1=50%, GW+2=30%, GW+3=20%) with blank GW+1 cap.
 *   2. ICT decomposition for MID/FWD (influence + creativity + threat).
 *   3. Opponent-adjusted form via optional adjustedFormMap.
 */
function computeInScore(
  player: FplPlayer,
  fixtureMap: Map<number, Map<number, FixtureEntry[]>>,
  teamMap: Map<number, FplTeam>,
  next3Gws: number[],
  totalManagers: number,
  currentGw: number,
  adjustedFormMap?: Map<number, number>
): number {
  const pos = player.element_type;
  const rawForm = parseFloat(player.form) || 0;
  const effectiveForm = adjustedFormMap?.get(player.id) ?? rawForm;
  const xgc90 = player.expected_goals_conceded_per_90 ?? 1.5;
  const defContrib90 = player.defensive_contribution_per_90 ?? 0;
  const epNext = parseFloat(player.ep_next) || 0;
  const selectedPct = parseFloat(player.selected_by_percent) || 0;
  const transfersIn = player.transfers_in_event ?? 0;
  const minutes = player.minutes ?? 0;
  const { weightedAvg: wFdr, hasBlankGw1 } = weightedFdrForPlayer(player.team, fixtureMap, next3Gws);

  // suppress unused variable warning
  void teamMap;

  // 1. FDR component (30 pts max) — GW-weighted, easy fixtures = high score
  //    If blank in GW+1, cap at 5/30 (player can't score this week).
  let fdrScore = clamp01((5 - wFdr) / 4) * 30;
  if (hasBlankGw1) fdrScore = Math.min(fdrScore, 5);

  // 2. Quality component (20 pts max) — position-specific
  let qualityScore: number;
  if (pos === 1 || pos === 2) {
    // DEF/GK: reward low xGC and high defensive contribution
    const xgcComponent = clamp01((1.5 - xgc90) / 1.5) * 12;
    const defComponent = clamp01(defContrib90 / 0.8) * 8;
    qualityScore = xgcComponent + defComponent;
  } else {
    // MID/FWD: ICT decomposition — influence (8) + creativity (7) + threat (5)
    const influence = parseFloat(player.influence) || 0;
    const creativity = parseFloat(player.creativity) || 0;
    const threat = parseFloat(player.threat) || 0;
    const influenceScore = clamp01(influence / ICT_INFLUENCE_CAP) * 8;
    const creativityScore = clamp01(creativity / ICT_CREATIVITY_CAP) * 7;
    const threatScore = clamp01(threat / ICT_THREAT_CAP) * 5;
    qualityScore = influenceScore + creativityScore + threatScore;
  }

  // 3. Playing time reliability (15 pts max)
  const maxExpectedMins = currentGw * 90;
  const minutesScore = clamp01(minutes / maxExpectedMins) * 15;

  // 4. Form component (12 pts max) — opponent-adjusted if available
  const formScore = clamp01(effectiveForm / 12) * 12;

  // 5. ep_next component (10 pts max) — FPL's own oracle
  const epScore = clamp01(epNext / 15) * 10;

  // 6. Transfer momentum (8 pts max) — smart money signal
  const ownedCount = (selectedPct / 100) * totalManagers;
  const momentum = ownedCount > 0 ? transfersIn / ownedCount : 0;
  const momentumScore = clamp01(momentum / 0.20) * 8;

  // 7. Set-piece role (5 pts max)
  let setPiece = 0;
  if (player.penalties_order === 1) setPiece += 3;
  if (player.direct_freekicks_order === 1) setPiece += 1;
  if (player.corners_and_indirect_freekicks_order === 1) setPiece += 1;
  const setPieceScore = Math.min(5, setPiece);

  return fdrScore + qualityScore + minutesScore + formScore + epScore + momentumScore + setPieceScore;
}

function buildTransferPlayer(
  player: FplPlayer,
  team: FplTeam,
  fixtureMap: Map<number, Map<number, FixtureEntry[]>>,
  teamMap: Map<number, FplTeam>,
  next3Gws: number[]
): TransferPlayer {
  return {
    id: player.id,
    name: player.web_name,
    teamShort: team.short_name,
    teamCode: team.code,
    position: player.element_type,
    form: parseFloat(player.form) || 0,
    totalPoints: player.total_points,
    priceMillion: player.now_cost / 10,
    avgFdrNext3: avgFdrForPlayer(player.team, fixtureMap, next3Gws),
    nextFixtures: nextFixturesForPlayer(player.team, fixtureMap, teamMap, next3Gws),
  };
}

/** Why a squad player should be transferred out. */
function generateOutReasons(player: TransferPlayer, raw: FplPlayer): string[] {
  const reasons: string[] = [];

  if (player.nextFixtures.length === 0) {
    reasons.push("Blank gameweek — no fixture");
  } else if (player.avgFdrNext3 >= 4.0) {
    reasons.push(`Very tough run ahead (avg FDR ${player.avgFdrNext3.toFixed(1)})`);
  } else if (player.avgFdrNext3 >= 3.3) {
    reasons.push(`Difficult upcoming fixtures (avg FDR ${player.avgFdrNext3.toFixed(1)})`);
  }

  const cop = raw.chance_of_playing_next_round;
  if (cop !== null && cop !== undefined && cop <= 75) {
    reasons.push(`Fitness concern — only ${cop}% chance of playing next round`);
  }

  if (player.form < 2.5) {
    reasons.push(`Very poor recent form (${player.form.toFixed(1)} over last 5 GWs)`);
  } else if (player.form < 4) {
    reasons.push(`Below-average form (${player.form.toFixed(1)} over last 5 GWs)`);
  }

  if (raw.element_type === 3 || raw.element_type === 4) {
    const xgi90 = raw.expected_goal_involvements_per_90 ?? 0;
    if (xgi90 < 0.20) {
      reasons.push(`Low attacking output (xGI/90: ${xgi90.toFixed(2)})`);
    }
    const goals = raw.goals_scored ?? 0;
    const xg = parseFloat(raw.expected_goals) || 0;
    if (goals - xg > 3) {
      reasons.push(`Overperforming xG by ${(goals - xg).toFixed(1)} — regression risk`);
    }
  }

  if (raw.element_type <= 2) {
    const xgc90 = raw.expected_goals_conceded_per_90 ?? 1.5;
    if (xgc90 > 1.4) {
      reasons.push(`High goals conceded rate (xGC/90: ${xgc90.toFixed(2)})`);
    }
  }

  return reasons.slice(0, 3);
}

/** Why a non-squad player is worth bringing in. */
function generateInReasons(player: TransferPlayer, raw: FplPlayer): string[] {
  const reasons: string[] = [];

  if (player.avgFdrNext3 <= 2.0) {
    reasons.push(`Excellent fixtures ahead (avg FDR ${player.avgFdrNext3.toFixed(1)})`);
  } else if (player.avgFdrNext3 <= 2.5) {
    reasons.push(`Good upcoming fixtures (avg FDR ${player.avgFdrNext3.toFixed(1)})`);
  }

  if (player.form >= 8) {
    reasons.push(`Red-hot form (${player.form.toFixed(1)} over last 5 GWs)`);
  } else if (player.form >= 6) {
    reasons.push(`Strong recent form (${player.form.toFixed(1)} over last 5 GWs)`);
  }

  if (raw.element_type === 3 || raw.element_type === 4) {
    const xgi90 = raw.expected_goal_involvements_per_90 ?? 0;
    if (xgi90 >= 0.45) {
      reasons.push(`High attacking output (xGI/90: ${xgi90.toFixed(2)})`);
    }
  }

  if (raw.element_type <= 2) {
    const xgc90 = raw.expected_goals_conceded_per_90 ?? 1.5;
    const def90 = raw.defensive_contribution_per_90 ?? 0;
    if (xgc90 <= 1.0) {
      reasons.push(`Solid defence (xGC/90: ${xgc90.toFixed(2)})`);
    } else if (def90 >= 0.4) {
      reasons.push(`High defensive contribution (${def90.toFixed(2)}/90)`);
    }
  }

  const epNext = parseFloat(raw.ep_next) || 0;
  if (epNext >= 8) {
    reasons.push(`FPL projects ${epNext.toFixed(1)} pts next GW`);
  }

  if (raw.penalties_order === 1) {
    reasons.push("Designated penalty taker");
  } else if (raw.direct_freekicks_order === 1) {
    reasons.push("Primary direct free-kick taker");
  }

  return reasons.slice(0, 3);
}

async function computeTransferLists(
  squadRows: SquadPlayerRow[],
  allPlayers: FplPlayer[],
  teamMap: Map<number, FplTeam>,
  fixtureMap: Map<number, Map<number, FixtureEntry[]>>,
  next3Gws: number[],
  next5Gws: number[],
  totalManagers: number,
  currentGw: number,
  last5Gws: number[]
): Promise<{ outs: TransferOutCandidate[]; ins: TransferInCandidate[] }> {
  const squadIds = new Set(squadRows.map((r) => r.id));
  const playerMap = new Map(allPlayers.map((p) => [p.id, p]));

  const playerTeamMap = new Map(allPlayers.map((p) => [p.id, p.team]));

  // ── IN list: two-pass with opponent-adjusted form ──────────────────────────
  const MIN_MINUTES = 90;
  const candidates = allPlayers.filter(
    (p) =>
      !squadIds.has(p.id) &&
      (p.status === "a" || p.status === "d") &&
      (p.minutes ?? 0) >= MIN_MINUTES
  );

  // First pass: score all candidates without adjusted form
  const firstPass = candidates
    .flatMap((p) => {
      const team = teamMap.get(p.team);
      if (!team) return [];
      const score = computeInScore(p, fixtureMap, teamMap, next3Gws, totalManagers, currentGw);
      return [{ player: p, team, score }];
    })
    .sort((a, b) => b.score - a.score);

  // Fetch history for top 30 IN candidates + all squad players (OUT list)
  const top30Ids = firstPass.slice(0, 30).map((c) => c.player.id);
  const squadIds2 = squadRows.map((r) => r.id);
  const allHistoryIds = [...new Set([...top30Ids, ...squadIds2])];

  const { adjustedFormMap, gwPointsMap } = await fetchHistoryData(
    allHistoryIds,
    playerTeamMap,
    fixtureMap,
    last5Gws
  );

  // ── OUT list: rank squad players by out-score ──────────────────────────────
  const outs: TransferOutCandidate[] = squadRows
    .flatMap((row) => {
      const raw = playerMap.get(row.id);
      if (!raw) return [];
      const team = teamMap.get(raw.team);
      if (!team) return [];
      const score = Math.round(computeOutScore(raw, fixtureMap, next3Gws));
      const player = buildTransferPlayer(raw, team, fixtureMap, teamMap, next3Gws);
      const reasons = generateOutReasons(player, raw);
      const last5GwPoints = gwPointsMap.get(row.id);
      const next5GwFixtures = gwFixturesForPlayer(raw.team, fixtureMap, teamMap, next5Gws);
      return [{ ...player, score, reasons, last5GwPoints, next5GwFixtures }];
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 11);

  // Second pass: re-score top 30 with adjusted form
  const top30 = firstPass.slice(0, 30);
  const top30Rescored = top30.map(({ player: p, team }) => ({
    player: p,
    team,
    score: computeInScore(p, fixtureMap, teamMap, next3Gws, totalManagers, currentGw, adjustedFormMap),
  }));

  // Merge rescored top 30 + rest (already first-pass scored), re-sort
  const allScored = [...top30Rescored, ...firstPass.slice(30)].sort(
    (a, b) => b.score - a.score
  );

  const ins: TransferInCandidate[] = allScored.slice(0, 11).map(({ player: p, team, score }) => {
    const player = buildTransferPlayer(p, team, fixtureMap, teamMap, next3Gws);
    const reasons = generateInReasons(player, p);
    const last5GwPoints = gwPointsMap.get(p.id);
    const next5GwFixtures = gwFixturesForPlayer(p.team, fixtureMap, teamMap, next5Gws);
    return { ...player, score: Math.round(score), reasons, last5GwPoints, next5GwFixtures };
  });

  return { outs, ins };
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function buildSquadRows(
  teamId: string
): Promise<{
  rows: SquadPlayerRow[];
  captainSuggestions: CaptainSuggestion[];
  transferOuts: TransferOutCandidate[];
  transferIns: TransferInCandidate[];
  playerPool: FplPlayerPool[];
  currentGw: number;
  nextGw: number;
  nextDeadline: string;
  managerName: string;
  teamName: string;
  overallPoints: number;
  overallRank: number;
  gwPoints: number;
  gwNumber: number;
  squadValue: number;
  bank: number;
  leagues: { id: number; name: string; entryRank: number; lastRank: number }[];
}> {
  const [bootstrap, fixturesAll, entryInfo] = await Promise.all([
    getBootstrap(),
    getFixtures(),
    getEntryInfo(teamId),
  ]);

  // Determine current GW (for picks) and next GW (for display + fixtures)
  const currentGwEvent =
    bootstrap.events.find((e) => e.is_current) ||
    bootstrap.events.filter((e) => e.finished).at(-1);

  if (!currentGwEvent) throw new Error("Cannot determine current gameweek");
  const currentGw = currentGwEvent.id;

  const nextGwEvent = bootstrap.events.find((e) => e.is_next) ?? currentGwEvent;
  const nextGw = nextGwEvent.id;
  const nextDeadline = nextGwEvent.deadline_time;

  // Get picks for the current GW (already played/in progress)
  const picks = await getPicks(teamId, currentGw);

  // Build lookup maps
  const playerMap = new Map(bootstrap.elements.map((p) => [p.id, p]));
  const teamMap = new Map(bootstrap.teams.map((t) => [t.id, t]));

  // Fixture range: next GW → GW38
  const remainingGws = Array.from({ length: 38 - nextGw + 1 }, (_, i) => nextGw + i);
  const next3Gws = remainingGws.slice(0, 3);

  // Build fixture map: teamId -> gwId -> list of fixtures
  const fixtureMap = new Map<number, Map<number, FixtureEntry[]>>();

  for (const fix of fixturesAll) {
    if (!fix.event) continue;

    const addEntry = (tId: number, opponentId: number, isHome: boolean, fdr: number) => {
      if (!fixtureMap.has(tId)) fixtureMap.set(tId, new Map());
      const gwMap = fixtureMap.get(tId)!;
      if (!gwMap.has(fix.event)) gwMap.set(fix.event, []);
      gwMap.get(fix.event)!.push({ opponentId, isHome, fdr });
    };

    addEntry(fix.team_h, fix.team_a, true, fix.team_h_difficulty);
    addEntry(fix.team_a, fix.team_h, false, fix.team_a_difficulty);
  }

  // Separate and sort picks
  const starterPicks = picks.picks
    .filter((p) => p.position <= 11)
    .sort((a, b) => {
      const pa = playerMap.get(a.element);
      const pb = playerMap.get(b.element);
      if (!pa || !pb) return 0;
      if (pa.element_type !== pb.element_type) return pa.element_type - pb.element_type;
      return a.position - b.position;
    });

  const benchPicks = picks.picks
    .filter((p) => p.position > 11)
    .sort((a, b) => a.position - b.position);

  const orderedPicks = [...starterPicks, ...benchPicks];

  const rows: SquadPlayerRow[] = orderedPicks.map((pick) => {
    const player = playerMap.get(pick.element);
    if (!player) throw new Error(`Player ${pick.element} not found`);
    const team = teamMap.get(player.team);
    if (!team) throw new Error(`Team ${player.team} not found`);

    const gwFixtures = fixtureMap.get(player.team) ?? new Map();

    const fixtures: PlayerFixtureCell[] = remainingGws.map((gw) => {
      const gwEntries: FixtureEntry[] = gwFixtures.get(gw) ?? [];
      return {
        gameweek: gw,
        fixtures: gwEntries.map((f) => ({
          opponentShort: teamMap.get(f.opponentId)?.short_name ?? "?",
          isHome: f.isHome,
          fdr: f.fdr,
        })),
      };
    });

    return {
      id: player.id,
      name: player.web_name,
      teamId: player.team,
      teamCode: team.code,
      teamShort: team.short_name,
      position: player.element_type,
      form: player.form,
      totalPoints: player.total_points,
      nowCost: player.now_cost,
      isCaptain: pick.is_captain,
      isViceCaptain: pick.is_vice_captain,
      isStarter: pick.position <= 11,
      fixtures,
    };
  });

  // Captain suggestions per GW
  const captainSuggestions: CaptainSuggestion[] = remainingGws.map((gw) => {
    const gwIndex = gw - nextGw;
    const candidates = rows
      .filter((r) => r.fixtures[gwIndex]?.fixtures.length > 0)
      .map((r) => {
        const gwFixtures = r.fixtures[gwIndex].fixtures;
        const avgFdr = gwFixtures.reduce((sum, f) => sum + f.fdr, 0) / gwFixtures.length;
        return { row: r, avgFdr, gwFixtures };
      });
    candidates.sort((a, b) => a.avgFdr - b.avgFdr || b.row.totalPoints - a.row.totalPoints);
    const best = candidates[0];
    return {
      gameweek: gw,
      playerId: best?.row.id ?? 0,
      playerName: best?.row.name ?? "-",
      opponentShort: best?.gwFixtures[0]?.opponentShort ?? "-",
      isHome: best?.gwFixtures[0]?.isHome ?? false,
      avgFdr: best?.avgFdr ?? 0,
      totalPoints: best?.row.totalPoints ?? 0,
    };
  });

  // Transfer recommendations
  const totalManagers = bootstrap.total_players ?? 13000000;
  const next5Gws = remainingGws.slice(0, 5);
  const last5Gws = Array.from({ length: 5 }, (_, i) => currentGw - 4 + i).filter((g) => g >= 1);
  const { outs: transferOuts, ins: transferIns } = await computeTransferLists(
    rows,
    bootstrap.elements,
    teamMap,
    fixtureMap,
    next3Gws,
    next5Gws,
    totalManagers,
    currentGw,
    last5Gws
  );

  const leagues = entryInfo.leagues.classic
    .filter((l) => l.name !== "Overall")
    .slice(0, 5)
    .map((l) => ({
      id: l.id,
      name: l.name,
      entryRank: l.entry_rank,
      lastRank: l.entry_last_rank,
    }));

  // Build player pool for Plan Mode — all available non-squad players
  const squadIds = new Set(rows.map((r) => r.id));
  const playerPool: FplPlayerPool[] = bootstrap.elements
    .filter((p) => !squadIds.has(p.id) && (p.status === "a" || p.status === "d"))
    .map((p) => {
      const team = teamMap.get(p.team);
      if (!team) return null;
      const gwFixtures = fixtureMap.get(p.team) ?? new Map<number, FixtureEntry[]>();
      const fixtures: PlayerFixtureCell[] = remainingGws.map((gw) => {
        const gwEntries = gwFixtures.get(gw) ?? [];
        return {
          gameweek: gw,
          fixtures: gwEntries.map((f) => ({
            opponentShort: teamMap.get(f.opponentId)?.short_name ?? "?",
            isHome: f.isHome,
            fdr: f.fdr,
          })),
        };
      });
      return {
        id: p.id,
        name: p.web_name,
        teamId: p.team,
        teamCode: team.code,
        teamShort: team.short_name,
        position: p.element_type,
        form: p.form,
        totalPoints: p.total_points,
        nowCost: p.now_cost,
        fixtures,
      };
    })
    .filter(Boolean) as FplPlayerPool[];

  return {
    rows,
    captainSuggestions,
    transferOuts,
    transferIns,
    playerPool,
    currentGw,
    nextGw,
    nextDeadline,
    managerName: `${entryInfo.player_first_name} ${entryInfo.player_last_name}`,
    teamName: entryInfo.name,
    overallPoints: entryInfo.summary_overall_points,
    overallRank: entryInfo.summary_overall_rank,
    gwPoints: entryInfo.summary_event_points,
    gwNumber: entryInfo.summary_event ?? currentGw,
    squadValue: entryInfo.last_deadline_value / 10,
    bank: entryInfo.last_deadline_bank / 10,
    leagues,
  };
}

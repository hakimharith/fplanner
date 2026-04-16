import { buildSquadRows } from "@/lib/fpl";
import TeamPageClient from "@/components/TeamPageClient";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";

interface Props {
  params: Promise<{ teamId: string }>;
}

export default async function TeamPage({ params }: Props) {
  const { teamId } = await params;

  let data;
  try {
    data = await buildSquadRows(teamId);
  } catch {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--fpl-bg-main)] p-4">
        <div className="rounded-xl shadow p-8 max-w-md w-full text-center" style={{ background: "var(--fpl-bg-surface)", border: "1px solid var(--fpl-border)" }}>
          <p className="text-red-500 font-semibold text-lg mb-2">Could not load team</p>
          <p className="text-sm mb-4" style={{ color: "var(--fpl-muted)" }}>
            Team ID <strong>{teamId}</strong> was not found or the FPL API is unavailable.
          </p>
          <Link
            href="/"
            className="inline-block text-white px-5 py-2 rounded-lg text-sm font-medium transition"
            style={{ background: "var(--fpl-bg-deep)", color: "white" }}
          >
            ← Try another ID
          </Link>
        </div>
      </main>
    );
  }

  const { rows, captainSuggestions, transferOuts, transferIns, playerPool, currentGw, nextGw, nextDeadline, managerName, teamName, overallPoints, overallRank, gwPoints, gwNumber, squadValue, bank, leagues } = data;
  const gameweeks = Array.from(
    { length: 38 - nextGw + 1 },
    (_, i) => nextGw + i
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--fpl-bg-main)" }}>
      {/* Top nav — sticky, always FPL purple */}
      <div className="sticky top-0 z-50 bg-[#37003c] border-b border-white/10 px-4 py-3 shrink-0">
        <div className="w-full flex items-center justify-between">
          {/* Left — brand logo */}
          <div className="flex items-center gap-2 select-none">
            <svg viewBox="0 0 72 82" width="22" height="25" fill="none" aria-hidden="true">
              <path d="M36 78 C10 68 4 50 4 36 V12 Q4 4 12 4 H60 Q68 4 68 12 V36 C68 50 62 68 36 78Z" fill="#37003c" />
              <path d="M36 78 C10 68 4 50 4 36 V12 Q4 4 12 4 H60 Q68 4 68 12 V36 C68 50 62 68 36 78Z" fill="none" stroke="#00ff87" strokeWidth="1.8" />
              <path d="M36 73 C13 64 8 48 8 36 V14 Q8 8 14 8 H58 Q64 8 64 14 V36 C64 48 59 64 36 73Z" fill="none" stroke="rgba(0,255,135,0.22)" strokeWidth="0.8" />
              <rect x="20" y="4" width="32" height="5" fill="#00ff87" />
              {/* FWD dots */}
              <circle cx="22" cy="20" r="2.8" fill="#00ff87" />
              <circle cx="36" cy="18" r="2.8" fill="#00ff87" />
              <circle cx="50" cy="20" r="2.8" fill="#00ff87" />
              {/* MID dots */}
              <circle cx="22" cy="34" r="2.5" fill="#00ff87" opacity="0.82" />
              <circle cx="36" cy="32" r="2.5" fill="#00ff87" opacity="0.82" />
              <circle cx="50" cy="34" r="2.5" fill="#00ff87" opacity="0.82" />
              {/* DEF dots */}
              <circle cx="16" cy="50" r="2.3" fill="#00ff87" opacity="0.62" />
              <circle cx="28" cy="48" r="2.3" fill="#00ff87" opacity="0.62" />
              <circle cx="44" cy="48" r="2.3" fill="#00ff87" opacity="0.62" />
              <circle cx="56" cy="50" r="2.3" fill="#00ff87" opacity="0.62" />
              {/* GK dot */}
              <circle cx="36" cy="63" r="2.5" fill="#00ff87" opacity="0.42" />
              {/* Halfway line */}
              <line x1="10" y1="43" x2="62" y2="43" stroke="rgba(0,255,135,0.15)" strokeWidth="0.8" />
            </svg>
            <span style={{ fontFamily: "var(--font-barlow)", fontWeight: 800, fontSize: "1.1rem", letterSpacing: "0.01em" }}>
              <span style={{ color: "#00ff87" }}>FPL</span>
              <span style={{ color: "white" }}>anner</span>
            </span>
          </div>
          {/* Right */}
          <ThemeToggle />
        </div>
      </div>

      {/* Body: collapsible sidebar + main (client-managed) */}
      <TeamPageClient
        teamName={teamName}
        managerName={managerName}
        overallPoints={overallPoints}
        overallRank={overallRank}
        gwPoints={gwPoints}
        gwNumber={gwNumber}
        currentGw={currentGw}
        squadValue={squadValue}
        bank={bank}
        leagues={leagues}
        players={rows}
        gameweeks={gameweeks}
        captainSuggestions={captainSuggestions}
        transferOuts={transferOuts}
        transferIns={transferIns}
        nextGw={nextGw}
        nextDeadline={nextDeadline}
        playerPool={playerPool}
        teamId={teamId}
      />
    </div>
  );
}

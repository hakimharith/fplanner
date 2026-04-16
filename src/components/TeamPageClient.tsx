"use client";

import { useState } from "react";
import type { SquadPlayerRow, CaptainSuggestion, TransferOutCandidate, TransferInCandidate, FplPlayerPool } from "@/types/fpl";
import TeamSidebar from "./TeamSidebar";
import TeamTabs from "./TeamTabs";

interface League {
  id: number;
  name: string;
  entryRank: number;
  lastRank: number;
}

interface Props {
  // Sidebar
  teamName: string;
  managerName: string;
  overallPoints: number;
  overallRank: number;
  gwPoints: number;
  gwNumber: number;
  currentGw: number;
  squadValue: number;
  bank: number;
  leagues: League[];
  // Tabs
  players: SquadPlayerRow[];
  gameweeks: number[];
  captainSuggestions: CaptainSuggestion[];
  transferOuts: TransferOutCandidate[];
  transferIns: TransferInCandidate[];
  nextGw: number;
  nextDeadline: string;
  playerPool: FplPlayerPool[];
  teamId: string;
}

// Desktop sidebar width in px — matches PlayerSelectionSidebar panel width
const SIDEBAR_W = 360;
// Right player-selection panel width in px
const PLAN_PANEL_W = 360;

export default function TeamPageClient({
  teamName, managerName, overallPoints, overallRank, gwPoints, gwNumber,
  currentGw, squadValue, bank, leagues,
  players, gameweeks, captainSuggestions, transferOuts, transferIns,
  nextGw, nextDeadline, playerPool, teamId,
}: Props) {
  const [isPlanMode, setIsPlanMode] = useState(false);

  const sidebarProps = {
    teamName, managerName, overallPoints, overallRank, gwPoints, gwNumber,
    currentGw, nextGw, squadValue, bank, leagues,
  };

  return (
    <div className="flex flex-col lg:flex-row flex-1">

      {/* ── Mobile left sidebar — hidden in plan mode ── */}
      {!isPlanMode && (
        <div className="lg:hidden">
          <TeamSidebar {...sidebarProps} />
        </div>
      )}

      {/* ── Desktop left sidebar — slides to 0 in plan mode ── */}
      <div
        className="hidden lg:block shrink-0 overflow-hidden"
        style={{
          width: isPlanMode ? 0 : SIDEBAR_W,
          opacity: isPlanMode ? 0 : 1,
          transition: "width 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease",
          pointerEvents: isPlanMode ? "none" : undefined,
        }}
      >
        <TeamSidebar {...sidebarProps} />
      </div>

      {/* ── Main content — gains extra right padding in plan mode ── */}
      <main
        className="flex-1 px-4 lg:px-8 py-6"
        style={{
          background: "var(--fpl-bg-main)",
          // Reserve space for the fixed left panel on desktop
          paddingLeft: isPlanMode
            ? `calc(${PLAN_PANEL_W}px + 2rem)` // 2rem = lg:px-8
            : undefined,
          transition: "padding-left 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <TeamTabs
          players={players}
          gameweeks={gameweeks}
          captainSuggestions={captainSuggestions}
          transferOuts={transferOuts}
          transferIns={transferIns}
          currentGw={nextGw}
          nextDeadline={nextDeadline}
          playerPool={playerPool}
          teamId={teamId}
          bank={bank}
          onTabChange={(tab) => setIsPlanMode(tab === "plan")}
        />
      </main>
    </div>
  );
}

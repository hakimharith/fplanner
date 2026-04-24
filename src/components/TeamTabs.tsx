"use client";

import React, { useState } from "react";
import type { SquadPlayerRow, CaptainSuggestion, TransferOutCandidate, TransferInCandidate, FplPlayerPool } from "@/types/fpl";
import PitchView from "./PitchView";
import FixtureGrid from "./FixtureGrid";
import FdrLegend from "./FdrLegend";
import TransferRecommendations from "./TransferRecommendations";
import PlanTab from "./PlanTab";
import CountdownClock from "./CountdownClock";

interface Props {
  players: SquadPlayerRow[];
  gameweeks: number[];
  captainSuggestions: CaptainSuggestion[];
  transferOuts: TransferOutCandidate[];
  transferIns: TransferInCandidate[];
  currentGw: number;
  nextDeadline: string;
  playerPool: FplPlayerPool[];
  teamId: string;
  bank: number;
  onTabChange?: (tab: Tab) => void;
}

type Tab = "pitch" | "fixtures" | "transfers" | "plan";

function IconPitch() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <rect x="1" y="1" width="12" height="12" rx="1" />
      <line x1="7" y1="1" x2="7" y2="13" />
      <circle cx="7" cy="7" r="2" />
      <path d="M1 4.5h2M11 4.5h2M1 9.5h2M11 9.5h2" />
    </svg>
  );
}

function IconGrid() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <rect x="1" y="1" width="5" height="5" rx="0.5" />
      <rect x="8" y="1" width="5" height="5" rx="0.5" />
      <rect x="1" y="8" width="5" height="5" rx="0.5" />
      <rect x="8" y="8" width="5" height="5" rx="0.5" />
    </svg>
  );
}

function IconTips() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M7 1a4 4 0 0 1 2.5 7.1c-.4.35-.5.7-.5 1.1V10H5v-.8c0-.4-.1-.75-.5-1.1A4 4 0 0 1 7 1Z" />
      <line x1="5" y1="11.5" x2="9" y2="11.5" />
      <line x1="5.5" y1="13" x2="8.5" y2="13" />
    </svg>
  );
}

function IconPlan() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 1.5 L12.5 4.5 L5 12 L1.5 12.5 L2 9 Z" />
      <line x1="8" y1="3" x2="11" y2="6" />
    </svg>
  );
}

const TAB_ICONS: Record<Tab, React.FC> = {
  pitch: IconPitch,
  fixtures: IconGrid,
  transfers: IconTips,
  plan: IconPlan,
};

const TABS: { id: Tab; label: string }[] = [
  { id: "pitch",     label: "Pitch" },
  { id: "fixtures",  label: "Grid"  },
  { id: "transfers", label: "Tips"  },
  { id: "plan",      label: "Plan"  },
];

export default function TeamTabs({
  players,
  gameweeks,
  currentGw,
  nextDeadline,
  transferOuts = [],
  transferIns = [],
  playerPool,
  teamId,
  bank,
  onTabChange,
}: Props) {
  const [tab, setTab] = useState<Tab>("pitch");
  const [gwIndex, setGwIndex] = useState(0);

  function handleTabChange(next: Tab) {
    setTab(next);
    onTabChange?.(next);
  }
  const [planTransferCount, setPlanTransferCount] = useState(0);

  const selectedGw = gameweeks[gwIndex];

  return (
    <div className="space-y-6">
      {/* Tab toggle — tabs left, countdown right */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex rounded-md overflow-hidden border border-[#37003c] w-full sm:w-auto">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold transition-colors relative ${i > 0 ? "border-l border-[#37003c]" : ""}`}
              style={
                tab === t.id
                  ? { background: "#37003c", color: "white" }
                  : { background: "transparent", color: "var(--fpl-muted)" }
              }
              onMouseEnter={(e) => {
                if (tab !== t.id) (e.currentTarget as HTMLButtonElement).style.color = "rgb(var(--fpl-text))";
              }}
              onMouseLeave={(e) => {
                if (tab !== t.id) (e.currentTarget as HTMLButtonElement).style.color = "var(--fpl-muted)";
              }}
            >
              {(() => { const Icon = TAB_ICONS[t.id]; return <Icon />; })()}
              {t.label}
              {t.id === "plan" && planTransferCount > 0 && (
                <span
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-black"
                  style={
                    tab === "plan"
                      ? { background: "#00ff87", color: "#37003c" }
                      : { background: "#37003c", color: "white" }
                  }
                >
                  {planTransferCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <CountdownClock deadline={nextDeadline} nextGw={currentGw} />
      </div>

      {/* GW navigator — shown for Pitch View and Plan (always same position) */}
      {(tab === "pitch" || tab === "plan") && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setGwIndex((i) => Math.max(0, i - 1))}
            disabled={gwIndex === 0}
            className="w-9 h-9 flex items-center justify-center rounded-full text-white font-bold text-base disabled:opacity-30 transition"
            style={{ background: "#37003c", border: "1px solid rgba(255,255,255,0.2)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.75"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
            aria-label="Previous gameweek"
          >
            ‹
          </button>
          <span
            className="min-w-[72px] text-center tracking-wide"
            style={{ color: "rgb(var(--fpl-text))", fontFamily: "var(--font-barlow)", fontWeight: 800, fontSize: "1.2rem" }}
          >
            GW{selectedGw}
          </span>
          <button
            onClick={() => setGwIndex((i) => Math.min(gameweeks.length - 1, i + 1))}
            disabled={gwIndex === gameweeks.length - 1}
            className="w-9 h-9 flex items-center justify-center rounded-full text-white font-bold text-base disabled:opacity-30 transition"
            style={{ background: "#37003c", border: "1px solid rgba(255,255,255,0.2)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.75"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
            aria-label="Next gameweek"
          >
            ›
          </button>
        </div>
      )}

      {tab === "pitch" && (
        <PitchView players={players} selectedGw={selectedGw} selectedGwIndex={gwIndex} />
      )}

      {tab === "fixtures" && (
        <>
          <FdrLegend />
          <FixtureGrid players={players} gameweeks={gameweeks} currentGw={currentGw} />
        </>
      )}

      {tab === "transfers" && (
        <TransferRecommendations outs={transferOuts} ins={transferIns} teamId={teamId} />
      )}

      {tab === "plan" && (
        <PlanTab
          players={players}
          playerPool={playerPool}
          gwIndex={gwIndex}
          teamId={teamId}
          bank={bank}
          onTransferCountChange={setPlanTransferCount}
        />
      )}
    </div>
  );
}

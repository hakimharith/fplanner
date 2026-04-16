"use client";

import type { SquadPlayerRow } from "@/types/fpl";
import PlayerPitchCard from "./PlayerPitchCard";

interface Props {
  players: SquadPlayerRow[];        // effective players (post-transfer)
  originalPlayerIds: number[];      // players[i].id of original squad in same slot order
  plannedInIds: Set<number>;        // ids of transferred-in players
  selectedGwIndex: number;
  pendingSlotIndices: Set<number>;  // all slots currently awaiting a replacement
  onPlayerClick: (slotIndex: number) => void;
}

function PitchMarkings() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 340 480"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="16" y="10" width="308" height="460" rx="2" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <line x1="16" y1="240" x2="324" y2="240" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <circle cx="170" cy="240" r="42" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <circle cx="170" cy="240" r="2" fill="rgba(255,255,255,0.4)" />
      <rect x="85" y="10" width="170" height="72" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <rect x="125" y="10" width="90" height="28" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <circle cx="170" cy="60" r="1.8" fill="rgba(255,255,255,0.4)" />
      <rect x="85" y="398" width="170" height="72" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <rect x="125" y="442" width="90" height="28" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <circle cx="170" cy="420" r="1.8" fill="rgba(255,255,255,0.4)" />
      <path d="M16 10 Q24 10 24 18" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
      <path d="M324 10 Q316 10 316 18" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
      <path d="M16 470 Q24 470 24 462" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
      <path d="M324 470 Q316 470 316 462" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
    </svg>
  );
}

interface ClickableCardProps {
  player: SquadPlayerRow;
  slotIndex: number;
  plannedInIds: Set<number>;
  selectedGwIndex: number;
  pendingSlotIndices: Set<number>;
  isBench: boolean;
  onPlayerClick: (slotIndex: number) => void;
}

function ClickableCard({
  player,
  slotIndex,
  plannedInIds,
  selectedGwIndex,
  pendingSlotIndices,
  isBench,
  onPlayerClick,
}: ClickableCardProps) {
  const isPlannedIn = plannedInIds.has(player.id);
  // Grey out this slot when it's pending replacement (and not already transferred in)
  const isPendingReplace = !isPlannedIn && pendingSlotIndices.has(slotIndex);

  return (
    <button
      type="button"
      className="relative group/swap cursor-pointer"
      onClick={() => onPlayerClick(slotIndex)}
      aria-label={isPlannedIn ? `Undo transfer in ${player.name}` : `Replace ${player.name}`}
      style={{
        filter: isPendingReplace ? "grayscale(1) brightness(0.55)" : "none",
        opacity: isPendingReplace ? 0.7 : 1,
        transition: "filter 0.2s ease, opacity 0.2s ease",
        background: "none",
        border: "none",
        padding: 0,
        textAlign: "left" as const,
      }}
    >
      {/* Badge: × for originals, ✓ for planned-in */}
      <span
        role="img"
        aria-hidden="true"
        className="absolute top-0 left-0 z-20 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-black leading-none shadow-md"
        style={{
          background: isPlannedIn ? "#00ff87" : isPendingReplace ? "#6b7280" : "#dc2626",
          color: "white",
        }}
      >
        {isPlannedIn ? "✓" : "×"}
      </span>
      <PlayerPitchCard player={player} selectedGwIndex={selectedGwIndex} isBench={isBench} />
    </button>
  );
}

export default function PlanPitchView({
  players,
  originalPlayerIds,
  plannedInIds,
  selectedGwIndex,
  pendingSlotIndices,
  onPlayerClick,
}: Props) {
  const starters = players.filter((p) => p.isStarter);
  const bench = players.filter((p) => !p.isStarter);

  const gk   = starters.filter((p) => p.position === 1);
  const defs = starters.filter((p) => p.position === 2);
  const mids = starters.filter((p) => p.position === 3);
  const fwds = starters.filter((p) => p.position === 4);

  // Build a map from player id → slot index (position in the original players array)
  const idToSlotIndex = new Map<number, number>();
  players.forEach((p, i) => {
    idToSlotIndex.set(p.id, i);
  });

  // Also map original ids to slot indexes for transferred-in players
  // originalPlayerIds[i] is the original id of slot i
  const origIdToSlot = new Map<number, number>();
  originalPlayerIds.forEach((origId, i) => {
    origIdToSlot.set(origId, i);
  });

  // Helper: get the slot index for a player in the effective lineup
  // If the player was transferred in, find their slot via originalPlayerIds
  function getSlotIndex(player: SquadPlayerRow): number {
    // Try direct id match first
    if (idToSlotIndex.has(player.id)) {
      return idToSlotIndex.get(player.id)!;
    }
    // Fallback: scan players array
    return players.findIndex((p) => p.id === player.id);
  }

  function renderRow(rowPlayers: SquadPlayerRow[], isBench: boolean) {
    return rowPlayers.map((p) => {
      const slotIdx = getSlotIndex(p);
      return (
        <ClickableCard
          key={p.id}
          player={p}
          slotIndex={slotIdx}
          plannedInIds={plannedInIds}
          selectedGwIndex={selectedGwIndex}
          pendingSlotIndices={pendingSlotIndices}
          isBench={isBench}
          onPlayerClick={onPlayerClick}
        />
      );
    });
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Pitch — split into background layer (clipped) + player layer (overflow visible) */}
      <div className="relative w-full shadow-2xl">

        {/* Background layer: clips to rounded corners */}
        <div
          className="absolute inset-0 rounded-t-xl overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #1a7a3c 0%, #1e8a44 12.5%, #1a7a3c 12.5%, #1a7a3c 25%, #1e8a44 25%, #1e8a44 37.5%, #1a7a3c 37.5%, #1a7a3c 50%, #1e8a44 50%, #1e8a44 62.5%, #1a7a3c 62.5%, #1a7a3c 75%, #1e8a44 75%, #1e8a44 87.5%, #1a7a3c 87.5%, #1a7a3c 100%)",
          }}
        >
          {/* Fantasy ad boards */}
          <div className="absolute top-0 left-0 right-0 z-20 flex h-10 pointer-events-none">
            <div
              className="flex-1 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #04a5c8 0%, #00cfff 100%)" }}
            >
              <span
                className="text-white text-sm tracking-widest uppercase opacity-90 select-none"
                style={{ fontFamily: "var(--font-barlow)", fontWeight: 800 }}
              >
                Fantasy
              </span>
            </div>
            <div className="w-[30%] bg-transparent" />
            <div
              className="flex-1 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #04a5c8 0%, #00cfff 100%)" }}
            >
              <span
                className="text-white text-sm tracking-widest uppercase opacity-90 select-none"
                style={{ fontFamily: "var(--font-barlow)", fontWeight: 800 }}
              >
                Fantasy
              </span>
            </div>
          </div>
          <PitchMarkings />
        </div>

        {/* Player layer — overflow visible so tooltips appear above pitch */}
        <div
          key={selectedGwIndex}
          className="relative z-10 flex flex-col justify-between pt-12 pb-8 px-2 gap-5 min-h-[520px] sm:min-h-[580px]"
        >
          <div className="flex justify-center items-end gap-1 sm:gap-3 w-full">
            {renderRow(gk, false)}
          </div>
          <div className="flex justify-center items-end gap-1 sm:gap-3 w-full">
            {renderRow(defs, false)}
          </div>
          <div className="flex justify-center items-end gap-1 sm:gap-3 w-full">
            {renderRow(mids, false)}
          </div>
          <div className="flex justify-center items-end gap-1 sm:gap-3 w-full">
            {renderRow(fwds, false)}
          </div>
        </div>
      </div>

      {/* Substitutes bench */}
      <div
        className="border border-t-0 rounded-b-xl px-4 py-4"
        style={{ background: "var(--fpl-bg-surface)", borderColor: "var(--fpl-border)" }}
      >
        <p
          className="text-[10px] uppercase tracking-widest mb-3 text-center"
          style={{ color: "var(--fpl-muted)", fontFamily: "var(--font-barlow)", fontWeight: 700 }}
        >
          Substitutes
        </p>
        <div className="flex justify-center gap-3 sm:gap-6">
          {renderRow(bench, true)}
        </div>
      </div>
    </div>
  );
}

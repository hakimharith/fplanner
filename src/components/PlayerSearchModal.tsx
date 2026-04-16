"use client";

import { useEffect, useRef, useState } from "react";
import type { FplPlayerPool, SquadPlayerRow } from "@/types/fpl";
import { POSITION_LABELS } from "@/types/fpl";
import { fdrStyle } from "./FdrLegend";

interface Props {
  outPlayer: SquadPlayerRow;
  playerPool: FplPlayerPool[];
  plannedInIds: Set<number>;
  selectedGwIndex: number;
  gameweeks: number[];
  onSelect: (inPlayer: FplPlayerPool) => void;
  onClose: () => void;
}

function kitUrl(teamCode: number, isGk: boolean) {
  const suffix = isGk ? "_1" : "";
  return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}${suffix}-110.png`;
}

export default function PlayerSearchModal({
  outPlayer,
  playerPool,
  plannedInIds,
  selectedGwIndex,
  onSelect,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Autofocus search input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keyboard trap: close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Filter to same position, then by query
  const samePositionPlayers = playerPool.filter(
    (p) => p.position === outPlayer.position
  );

  const filtered = samePositionPlayers
    .filter((p) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.teamShort.toLowerCase().includes(q)
      );
    })
    .slice(0, 50);

  const positionLabel = POSITION_LABELS[outPlayer.position] ?? "UNK";

  return (
    <>
      {/* Dark scrim */}
      <div
        className="fixed inset-0 z-[100]"
        style={{ background: "rgba(0,0,0,0.6)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-up panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Replace ${outPlayer.name}`}
        className="fixed bottom-0 left-0 right-0 z-[101] overflow-y-auto"
        style={{
          maxHeight: "80vh",
          background: "var(--fpl-bg-surface)",
          borderTop: "2px solid #00ff87",
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b"
          style={{
            background: "var(--fpl-bg-surface)",
            borderColor: "var(--fpl-border)",
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="text-base leading-tight"
              style={{
                fontFamily: "var(--font-barlow)",
                fontWeight: 800,
                color: `rgb(var(--fpl-text))`,
              }}
            >
              Replace{" "}
              <span style={{ color: "var(--fpl-green)" }}>{outPlayer.name}</span>
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase"
              style={{
                background: "#37003c",
                color: "var(--fpl-green)",
                fontFamily: "var(--font-barlow)",
              }}
            >
              {positionLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xl leading-none w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
            style={{ color: `rgb(var(--fpl-text))` }}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Search input */}
        <div className="px-4 py-3 border-b" style={{ borderColor: "var(--fpl-border)" }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or team..."
            className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-shadow"
            style={{
              background: "var(--fpl-bg-main)",
              color: `rgb(var(--fpl-text))`,
              border: "1px solid var(--fpl-border)",
              fontFamily: "var(--font-barlow)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = "0 0 0 2px #00ff87";
              e.currentTarget.style.borderColor = "#00ff87";
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "";
              e.currentTarget.style.borderColor = "var(--fpl-border)";
            }}
          />
        </div>

        {/* Results count */}
        <div className="px-4 pt-2 pb-1">
          <span
            className="text-[11px]"
            style={{ color: "var(--fpl-muted)", fontFamily: "var(--font-barlow)" }}
          >
            {filtered.length} player{filtered.length !== 1 ? "s" : ""} found
            {query && ` for "${query}"`}
          </span>
        </div>

        {/* Player list */}
        <ul className="divide-y" style={{ borderColor: "var(--fpl-border)" }}>
          {filtered.map((p) => {
            const isPlanned = plannedInIds.has(p.id);
            const isGk = p.position === 1;
            const nextCell = p.fixtures[selectedGwIndex];
            const nextFix = nextCell?.fixtures?.[0];

            return (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={isPlanned}
                  onClick={() => {
                    if (!isPlanned) {
                      onSelect(p);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{
                    opacity: isPlanned ? 0.45 : 1,
                    cursor: isPlanned ? "not-allowed" : "pointer",
                    background: "transparent",
                    border: "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isPlanned) {
                      e.currentTarget.style.background = "rgba(0,255,135,0.06)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {/* Kit image */}
                  <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={kitUrl(p.teamCode, isGk)}
                      alt={p.teamShort}
                      width={32}
                      height={32}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>

                  {/* Name & team */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm leading-tight truncate"
                      style={{
                        fontFamily: "var(--font-barlow)",
                        fontWeight: 700,
                        color: `rgb(var(--fpl-text))`,
                      }}
                    >
                      {p.name}
                    </p>
                    <p
                      className="text-[11px] leading-tight"
                      style={{ color: "var(--fpl-muted)", fontFamily: "var(--font-barlow)" }}
                    >
                      {p.teamShort}
                    </p>
                  </div>

                  {/* Price */}
                  <div
                    className="flex-shrink-0 text-sm font-bold"
                    style={{ fontFamily: "var(--font-barlow)", color: "var(--fpl-green)" }}
                  >
                    £{(p.nowCost / 10).toFixed(1)}m
                  </div>

                  {/* Form */}
                  <div
                    className="flex-shrink-0 text-xs text-right min-w-[2.5rem]"
                    style={{ color: "var(--fpl-muted)", fontFamily: "var(--font-barlow)" }}
                  >
                    <span className="block text-[10px] uppercase tracking-wide">Form</span>
                    <span style={{ color: `rgb(var(--fpl-text))`, fontWeight: 700 }}>{p.form}</span>
                  </div>

                  {/* Next GW FDR chip */}
                  <div className="flex-shrink-0 min-w-[64px] text-right">
                    {nextFix ? (
                      <span
                        className="inline-block text-[11px] font-bold px-1.5 py-0.5 rounded"
                        style={fdrStyle(nextFix.fdr)}
                      >
                        {nextFix.opponentShort} ({nextFix.isHome ? "H" : "A"})
                      </span>
                    ) : (
                      <span className="text-[11px] text-white/40">BGW</span>
                    )}
                  </div>

                  {/* Planned label */}
                  {isPlanned && (
                    <div
                      className="flex-shrink-0 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded font-bold"
                      style={{ background: "rgba(255,255,255,0.1)", color: "var(--fpl-muted)" }}
                    >
                      Planned
                    </div>
                  )}
                </button>
              </li>
            );
          })}

          {filtered.length === 0 && (
            <li className="px-4 py-8 text-center">
              <p style={{ color: "var(--fpl-muted)", fontFamily: "var(--font-barlow)" }}>
                No players found
              </p>
            </li>
          )}
        </ul>
      </div>
    </>
  );
}

"use client";

import React, { useState, useRef, useEffect } from "react";
import type { FplPlayerPool } from "@/types/fpl";
import { fdrStyle } from "./FdrLegend";

interface Props {
  playerPool: FplPlayerPool[];
  squadPlayerIds: Set<number>;
  plannedInIds: Set<number>;
  selectedPositions: number[];
  selectedGwIndex: number;
  onSelect: (player: FplPlayerPool) => void;
  onRemovePlanned: (playerId: number) => void;
  fillHeight?: boolean;
  currentBank?: number;
}

const POSITION_LABELS: Record<number, string> = { 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" };
const POSITION_NAMES: Record<number, string> = {
  1: "Goalkeepers",
  2: "Defenders",
  3: "Midfielders",
  4: "Forwards",
};
const ORDER = [1, 2, 3, 4] as const;
const ALL_MODE_LIMIT = 5;

function kitUrl(teamCode: number, isGk: boolean): string {
  return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}${isGk ? "_1" : ""}-110.png`;
}

const dropdownStyle: React.CSSProperties = {
  background: "var(--fpl-bg-main)",
  color: "rgb(var(--fpl-text))",
  border: "1px solid var(--fpl-border)",
  borderRadius: "0.375rem",
  fontSize: "12px",
  padding: "4px 8px",
  outline: "none",
  cursor: "pointer",
};

export default function PlayerSelectionSidebar({
  playerPool,
  squadPlayerIds,
  plannedInIds,
  selectedPositions,
  selectedGwIndex: _selectedGwIndex,
  onSelect,
  onRemovePlanned,
  fillHeight = false,
  currentBank,
}: Props) {
  void _selectedGwIndex;

  const [query, setQuery] = useState("");
  const [posFilters, setPosFilters] = useState<Set<number>>(new Set());
  const [clubFilters, setClubFilters] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"points" | "form" | "price">("points");
  const [showPanel, setShowPanel] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setShowPanel(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const posLocked = selectedPositions.length > 0;
  const pendingPosSet = new Set(selectedPositions);

  const effectivePosFilters = posLocked ? pendingPosSet : posFilters;
  const isAllMode = !posLocked && posFilters.size === 0 && clubFilters.size === 0;

  // Derive unique clubs and their codes from playerPool
  const uniqueClubs = Array.from(
    playerPool.reduce((map, p) => {
      if (!map.has(p.teamShort)) map.set(p.teamShort, p.teamCode);
      return map;
    }, new Map<string, number>()).entries()
  ).sort((a, b) => a[0].localeCompare(b[0]));

  const filtered = playerPool
    .filter((p) => {
      if (effectivePosFilters.size > 0) return effectivePosFilters.has(p.position);
      return true;
    })
    .filter((p) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.teamShort.toLowerCase().includes(q);
    })
    .filter((p) => {
      if (clubFilters.size === 0) return true;
      return clubFilters.has(p.teamShort);
    })
    .sort((a, b) => {
      if (sortBy === "points") return b.totalPoints - a.totalPoints;
      if (sortBy === "form") return parseFloat(b.form) - parseFloat(a.form);
      return b.nowCost - a.nowCost;
    });

  const grouped: Record<number, FplPlayerPool[]> = {
    1: filtered.filter((p) => p.position === 1),
    2: filtered.filter((p) => p.position === 2),
    3: filtered.filter((p) => p.position === 3),
    4: filtered.filter((p) => p.position === 4),
  };
  if (isAllMode) {
    (Object.keys(grouped) as unknown as (keyof typeof grouped)[]).forEach((pos) => {
      grouped[pos] = grouped[pos].slice(0, ALL_MODE_LIMIT);
    });
  }

  const displayedCount = Object.values(grouped).reduce((s, g) => s + g.length, 0);

  function handleReset() {
    setQuery("");
    setPosFilters(new Set());
    setClubFilters(new Set());
    setSortBy("points");
    setShowPanel(false);
  }

  function togglePos(pos: number) {
    setPosFilters((prev) => {
      const next = new Set(prev);
      next.has(pos) ? next.delete(pos) : next.add(pos);
      return next;
    });
  }

  function toggleClub(club: string) {
    setClubFilters((prev) => {
      const next = new Set(prev);
      next.has(club) ? next.delete(club) : next.add(club);
      return next;
    });
  }

  // Filter button label
  const activeCount = (posLocked ? 0 : posFilters.size) + clubFilters.size;
  let filterLabel = "All players";
  if (!posLocked && activeCount > 0) {
    const parts: string[] = [];
    if (posFilters.size > 0) parts.push([...posFilters].map((p) => POSITION_LABELS[p]).join(" · "));
    if (clubFilters.size > 0) {
      const clubs = [...clubFilters];
      parts.push(clubs.length <= 2 ? clubs.join(" · ") : `${clubs.slice(0, 2).join(" · ")} +${clubs.length - 2}`);
    }
    filterLabel = parts.join("  ·  ");
  } else if (posLocked) {
    filterLabel = [...pendingPosSet].map((p) => POSITION_LABELS[p]).join(" + ") + " only";
  }

  return (
    <div
      style={{
        background: "var(--fpl-bg-surface)",
        border: fillHeight ? "none" : "1px solid var(--fpl-border)",
        borderRadius: fillHeight ? 0 : "0.75rem",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        flex: fillHeight ? 1 : undefined,
        height: fillHeight ? "calc(100vh - var(--nav-height))" : "calc(100vh - 180px)",
        position: "relative",
      }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 shrink-0">
        <p style={{ fontFamily: "var(--font-barlow)", fontWeight: 800, fontSize: "1.3rem", color: "rgb(var(--fpl-text))" }}>
          Player Selection
        </p>
        <p className="mt-0.5 text-sm" style={{ color: "var(--fpl-muted)" }}>
          {posLocked
            ? `Showing ${[...pendingPosSet].map((p) => POSITION_LABELS[p]).join(" + ")} only`
            : "Simulate transfers and scout your future squad"}
        </p>
      </div>

      {/* Search */}
      <div className="px-4 pb-3 shrink-0">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
            style={{ color: "var(--fpl-muted)" }}>
            <circle cx="6" cy="6" r="4" /><line x1="9.5" y1="9.5" x2="13" y2="13" />
          </svg>
          <input
            type="text"
            placeholder="Search by name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none transition"
            style={{ background: "var(--fpl-bg-main)", color: "rgb(var(--fpl-text))", border: "1px solid var(--fpl-border)" }}
            onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 2px var(--fpl-green)"; }}
            onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; }}
          />
        </div>
      </div>

      {/* Filter + Sort row */}
      <div className="px-4 pb-3 shrink-0 flex items-center gap-2" style={{ position: "relative" }}>

        {/* All players filter button */}
        <button
          ref={btnRef}
          onClick={() => { if (!posLocked) setShowPanel((v) => !v); }}
          disabled={posLocked}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition flex-1 min-w-0"
          style={{
            ...dropdownStyle,
            flex: 1,
            color: "rgb(var(--fpl-text))",
            borderColor: activeCount > 0 ? "var(--fpl-green)" : "var(--fpl-border)",
            opacity: posLocked ? 0.5 : 1,
            cursor: posLocked ? "default" : "pointer",
            justifyContent: "space-between",
          }}
        >
          <span className="truncate">{filterLabel}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: "var(--fpl-muted)", flexShrink: 0, transform: showPanel ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            <path d="M2 3.5L5 6.5L8 3.5" />
          </svg>
        </button>

        {/* Sort dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "points" | "form" | "price")}
          style={{ ...dropdownStyle, flex: 1 }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--fpl-green)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--fpl-border)"; }}
        >
          <option value="points">Total points</option>
          <option value="form">Form</option>
          <option value="price">Price</option>
        </select>

        {/* Reset */}
        <button
          onClick={handleReset}
          className="text-xs px-2 py-1 rounded transition shrink-0"
          style={{ ...dropdownStyle, flex: "none" }}
        >
          Reset
        </button>
      </div>

      {/* Filter panel — overlays the list, anchored below the filter row */}
      {showPanel && (
        <div
          ref={panelRef}
          className="absolute left-0 right-0 z-30 overflow-y-auto"
          style={{
            top: "148px",
            bottom: 0,
            background: "var(--fpl-bg-surface)",
            borderTop: "1px solid var(--fpl-border)",
          }}
        >
          {/* Panel header */}
          <div
            className="px-4 py-3 flex items-center justify-between shrink-0"
            style={{ borderBottom: "1px solid var(--fpl-border)", background: "var(--fpl-bg-deep)" }}
          >
            <p style={{ fontFamily: "var(--font-barlow)", fontWeight: 800, fontSize: "1rem", color: "white", letterSpacing: "0.01em" }}>
              Select Filters
            </p>
            <button
              onClick={() => setShowPanel(false)}
              className="text-xs font-bold px-3 py-1 rounded transition"
              style={{ background: "#15803d", color: "white" }}
            >
              Done
            </button>
          </div>

          <div className="px-4 py-3 space-y-4">

            {/* Global */}
            <section>
              <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "var(--fpl-muted)" }}>Global</p>
              <button
                onClick={() => { setPosFilters(new Set()); setClubFilters(new Set()); setShowPanel(false); }}
                className="text-sm font-semibold px-3 py-1.5 rounded transition"
                style={{
                  background: activeCount === 0 ? "var(--fpl-bg-deep)" : "transparent",
                  color: activeCount === 0 ? "white" : "rgb(var(--fpl-text))",
                  border: activeCount === 0 ? "1px solid var(--fpl-accent)" : "1px solid var(--fpl-border)",
                }}
              >
                All players
              </button>
            </section>

            <div style={{ borderTop: "1px solid var(--fpl-border)" }} />

            {/* Position */}
            <section>
              <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "var(--fpl-muted)" }}>Position</p>
              <div className="grid grid-cols-2 gap-1.5">
                {ORDER.map((pos) => {
                  const active = posFilters.has(pos);
                  return (
                    <button
                      key={pos}
                      onClick={() => togglePos(pos)}
                      className="text-sm font-semibold px-3 py-1.5 rounded text-left transition"
                      style={{
                        background: active ? "var(--fpl-bg-deep)" : "transparent",
                        color: active ? "white" : "rgb(var(--fpl-text))",
                        border: active ? "1px solid var(--fpl-accent)" : "1px solid var(--fpl-border)",
                      }}
                    >
                      {POSITION_NAMES[pos]}
                    </button>
                  );
                })}
              </div>
            </section>

            <div style={{ borderTop: "1px solid var(--fpl-border)" }} />

            {/* Teams */}
            <section>
              <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "var(--fpl-muted)" }}>Teams</p>
              <div className="grid grid-cols-2 gap-1.5">
                {uniqueClubs.map(([club, teamCode]) => {
                  const active = clubFilters.has(club);
                  return (
                    <button
                      key={club}
                      onClick={() => toggleClub(club)}
                      className="flex items-center justify-center gap-1.5 px-2 py-2 rounded transition"
                      style={{
                        background: active ? "var(--fpl-bg-deep)" : "transparent",
                        color: active ? "white" : "rgb(var(--fpl-text))",
                        border: active ? "1px solid var(--fpl-accent)" : "1px solid var(--fpl-border)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://fantasy.premierleague.com/dist/img/badges/badge_${teamCode}_40.png`}
                        alt={club}
                        width={18}
                        height={18}
                        className="object-contain shrink-0"
                        onError={(e) => {
                          const el = e.currentTarget as HTMLImageElement;
                          if (!el.dataset.fallback) {
                            el.dataset.fallback = "1";
                            el.src = kitUrl(teamCode, false);
                          } else {
                            el.style.display = "none";
                          }
                        }}
                      />
                      <span className="text-[10px] font-semibold">{club}</span>
                    </button>
                  );
                })}
              </div>
            </section>

          </div>

        </div>
      )}

      {/* Player count + ITB */}
      <div className="px-4 pb-3 shrink-0 flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: "var(--fpl-muted)" }}>
          {displayedCount} player{displayedCount !== 1 ? "s" : ""} found
        </span>
        {currentBank !== undefined && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold" style={{ color: "var(--fpl-muted)" }}>ITB</span>
            <span
              className="text-sm font-black"
              style={{ fontFamily: "var(--font-barlow)", fontWeight: 800, color: currentBank >= 0 ? "var(--fpl-green)" : "#f87171" }}
            >
              {currentBank < 0 ? "-" : ""}£{Math.abs(currentBank).toFixed(1)}m
            </span>
          </div>
        )}
      </div>

      {/* Column headers */}
      <div
        className="px-4 py-1.5 flex items-center gap-2 shrink-0"
        style={{ borderTop: "1px solid var(--fpl-border)", borderBottom: "1px solid var(--fpl-border)" }}
      >
        <span className="w-8 shrink-0" />
        <span className="flex-1 text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--fpl-muted)" }}>Player</span>
        <span className="w-12 text-right text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--fpl-muted)" }}>Price</span>
        <span className="w-10 text-right text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--fpl-muted)" }}>TP</span>
        <span className="w-8" />
      </div>

      {/* Scrollable player list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {displayedCount === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm" style={{ color: "var(--fpl-muted)" }}>No players found</p>
          </div>
        ) : (
          ORDER.map((pos) => {
            const group = grouped[pos];
            if (group.length === 0) return null;
            return (
              <div key={pos}>
                <div
                  className="px-4 py-1.5 flex items-center"
                  style={{ background: "var(--fpl-bg-main)", borderBottom: "1px solid var(--fpl-border)" }}
                >
                  <span className="flex-1 text-[11px] uppercase tracking-widest font-semibold" style={{ color: "var(--fpl-muted)" }}>
                    {POSITION_NAMES[pos]}
                  </span>
                </div>

                {group.map((p) => {
                  const isPlanned = plannedInIds.has(p.id);
                  const isInSquad = squadPlayerIds.has(p.id);
                  const unavailable = isInSquad && !isPlanned;
                  const priceStr = `£${(p.nowCost / 10).toFixed(1)}m`;

                  return (
                    <div
                      key={p.id}
                      className="px-4 py-2 flex flex-col transition-colors cursor-pointer"
                      style={{ borderBottom: "1px solid var(--fpl-border)" }}
                      onMouseEnter={(e) => {
                        if (!unavailable) (e.currentTarget as HTMLDivElement).style.background = "rgba(0,255,135,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background = "transparent";
                      }}
                      onClick={() => {
                        if (isPlanned) onRemovePlanned(p.id);
                        else if (!unavailable) onSelect(p);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={kitUrl(p.teamCode, p.position === 1)}
                            alt={p.teamShort}
                            width={32}
                            height={32}
                            className="object-contain"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-1 min-w-0">
                            <p className="truncate text-sm leading-tight shrink-1 min-w-0"
                               style={{ fontFamily: "var(--font-barlow)", fontWeight: 700, color: unavailable ? "var(--fpl-muted)" : "rgb(var(--fpl-text))" }}>
                              {p.name}
                            </p>
                            <p className="text-[10px] shrink-0 whitespace-nowrap" style={{ color: "var(--fpl-muted)" }}>
                              {POSITION_LABELS[p.position]} · {p.teamShort}
                            </p>
                          </div>
                        </div>

                        <span className="w-12 text-right text-sm shrink-0"
                          style={{ fontFamily: "var(--font-barlow)", fontWeight: 700, color: unavailable ? "var(--fpl-muted)" : "var(--fpl-accent)" }}>
                          {priceStr}
                        </span>

                        <span className="w-10 text-right text-sm shrink-0"
                          style={{ fontFamily: "var(--font-barlow)", fontWeight: 700, color: "rgb(var(--fpl-text))" }}>
                          {p.totalPoints}
                        </span>

                        <div className="w-8 flex items-center justify-center shrink-0">
                          {isPlanned ? (
                            <button type="button" onClick={(e) => { e.stopPropagation(); onRemovePlanned(p.id); }}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition"
                              style={{ background: "#dc2626", color: "white" }} aria-label={`Remove ${p.name} from plan`}>
                              ×
                            </button>
                          ) : unavailable ? (
                            <button type="button" disabled
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                              style={{ background: "var(--fpl-bg-main)", color: "var(--fpl-muted)", border: "1px solid var(--fpl-border)" }}
                              aria-label={`${p.name} already in squad`}>
                              ×
                            </button>
                          ) : (
                            <button type="button" onClick={(e) => { e.stopPropagation(); onSelect(p); }}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-black transition"
                              style={{ border: "1px solid var(--fpl-accent)", color: "var(--fpl-accent)", background: "transparent" }}
                              aria-label={`Add ${p.name} to plan`}>
                              +
                            </button>
                          )}
                        </div>
                      </div>

                      {p.fixtures.length > 0 && (
                        <div className="flex gap-0.5 mt-3 w-full">
                          {(() => {
                            const chips: React.ReactNode[] = [];
                            for (const cell of p.fixtures) {
                              if (chips.length >= 5) break;
                              if (cell.fixtures.length === 0) {
                                chips.push(
                                  <span key={`bgw-${cell.gameweek}`}
                                    className="flex-1 text-[9px] font-bold px-1 py-0.5 rounded text-center min-w-0"
                                    style={{ background: "rgba(255,255,255,0.08)", color: "var(--fpl-muted)", border: "1px dashed var(--fpl-border)" }}>
                                    BGW
                                  </span>
                                );
                              } else {
                                for (const fix of cell.fixtures) {
                                  if (chips.length >= 5) break;
                                  chips.push(
                                    <span key={`${cell.gameweek}-${fix.opponentShort}`}
                                      className="flex-1 text-[9px] font-bold px-1 py-0.5 rounded text-center min-w-0 truncate"
                                      style={fdrStyle(fix.fdr)}>
                                      {fix.opponentShort}({fix.isHome ? "H" : "A"})
                                    </span>
                                  );
                                }
                              }
                            }
                            return chips;
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

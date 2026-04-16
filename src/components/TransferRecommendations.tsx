"use client";

import React, { useState } from "react";
import type { TransferOutCandidate, TransferInCandidate } from "@/types/fpl";
import { POSITION_LABELS } from "@/types/fpl";
import { fdrStyle } from "./FdrLegend";

interface Props {
  outs: TransferOutCandidate[];
  ins: TransferInCandidate[];
}

function kitUrl(teamCode: number, isGk: boolean) {
  const suffix = isGk ? "_1" : "";
  return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}${suffix}-110.png`;
}

function ScoreBar({ score, variant }: { score: number; variant: "out" | "in" }) {
  const pct = Math.min(100, score);
  const color = variant === "out"
    ? score >= 70 ? "#ef4444" : score >= 45 ? "#f59e0b" : "#94a3b8"
    : score >= 65 ? "#15803d" : score >= 45 ? "#f59e0b" : "#94a3b8";
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height: "5px", background: "rgba(255,255,255,0.08)" }}
      >
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "9999px", transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

function FixtureChips({ fixtures }: { fixtures: { opponentShort: string; isHome: boolean; fdr: number }[] }) {
  if (fixtures.length === 0) {
    return <span className="text-[10px]" style={{ color: "var(--fpl-muted)" }}>BGW</span>;
  }
  return (
    <div className="flex gap-1 flex-wrap">
      {fixtures.map((f, i) => (
        <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={fdrStyle(f.fdr)}>
          {f.opponentShort} {f.isHome ? "H" : "A"}
        </span>
      ))}
    </div>
  );
}

function PlayerCard({
  player,
  rank,
  variant,
}: {
  player: TransferOutCandidate | TransferInCandidate;
  rank: number;
  variant: "out" | "in";
}) {
  const isGk = player.position === 1;
  const accentColor = variant === "out" ? "#ef4444" : "var(--fpl-green)";
  const dimAccent = variant === "out" ? "rgba(239,68,68,0.12)" : "rgba(0,255,135,0.10)";
  const borderAccent = variant === "out" ? "rgba(239,68,68,0.2)" : "rgba(0,255,135,0.18)";

  return (
    // h-full so the card stretches to fill the grid row height, matching its pair
    <div
      className="rounded-xl overflow-hidden transition-colors duration-150 flex flex-col h-full"
      style={{ background: "var(--fpl-bg-surface)", border: `1px solid ${borderAccent}` }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = variant === "out" ? "rgba(239,68,68,0.4)" : "rgba(0,255,135,0.35)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = borderAccent; }}
    >
      {/* Rank + score + bar header */}
      <div className="px-3 pt-2.5 pb-1.5">
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0"
            style={{ background: dimAccent, color: accentColor }}
          >
            {rank}
          </span>
          <div className="flex-1">
            <ScoreBar score={player.score} variant={variant} />
          </div>
          <span
            className="tabular-nums font-black shrink-0 leading-none"
            style={{
              fontFamily: "var(--font-barlow)",
              fontSize: "1.5rem",
              color: variant === "out"
                ? player.score >= 70 ? "#ef4444" : player.score >= 45 ? "#f59e0b" : "#94a3b8"
                : player.score >= 65 ? "#15803d" : player.score >= 45 ? "#f59e0b" : "#94a3b8",
            }}
          >
            {player.score}
          </span>
        </div>

        {/* Player identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-8 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={kitUrl(player.teamCode, isGk)}
              alt={player.teamShort}
              className="w-full h-full object-contain drop-shadow"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="font-black text-sm leading-tight truncate"
              style={{ fontFamily: "var(--font-barlow)", fontWeight: 800, color: "rgb(var(--fpl-text))" }}
            >
              {player.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-[10px] font-bold px-1 py-px rounded" style={{ background: "rgba(255,255,255,0.08)", color: "var(--fpl-muted)" }}>
                {POSITION_LABELS[player.position]}
              </span>
              <span className="text-[10px]" style={{ color: "var(--fpl-muted)" }}>{player.teamShort}</span>
              <span className="text-[10px]" style={{ color: "var(--fpl-muted)" }}>£{player.priceMillion.toFixed(1)}m</span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div
              className="text-sm font-black tabular-nums"
              style={{ fontFamily: "var(--font-barlow)", fontWeight: 800, color: "rgb(var(--fpl-text))" }}
            >
              {player.totalPoints}
              <span className="text-[9px] font-normal ml-0.5" style={{ color: "var(--fpl-muted)" }}>pts</span>
            </div>
            <div className="text-[10px] tabular-nums" style={{ color: variant === "out" ? (player.form < 3 ? "#ef4444" : "var(--fpl-muted)") : (player.form >= 6 ? "var(--fpl-green)" : "var(--fpl-muted)") }}>
              {player.form.toFixed(1)} form
            </div>
          </div>
        </div>
      </div>

      {/* Fixtures */}
      <div className="px-3 py-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <FixtureChips fixtures={player.nextFixtures} />
      </div>

      {/* Reasons — flex-1 so shorter cards grow to fill the row, keeping bottoms aligned */}
      <div className="px-3 pb-2.5 flex-1" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {player.reasons.map((r, i) => (
          <div key={i} className="flex items-start gap-1.5 pt-1">
            <span className="text-[11px] shrink-0 mt-px" style={{ color: accentColor }}>
              {variant === "out" ? "↓" : "↑"}
            </span>
            <span className="text-[11px] leading-snug" style={{ color: "var(--fpl-muted)" }}>{r}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Colours hardcoded because the modal background is always #37003c (dark)
// regardless of light/dark theme — CSS variables flip in light mode and break contrast.
const M = {
  text:        "rgba(255,255,255,0.90)",
  muted:       "rgba(255,255,255,0.55)",
  faint:       "rgba(255,255,255,0.08)",
  border:      "rgba(255,255,255,0.09)",
  red:         "#ef4444",
  amber:       "#f59e0b",
  green:       "#00ff87",
  greenSoft:   "#4ade80",
  slate:       "#94a3b8",
  bg:          "#37003c",
  surface:     "#2a0035",
};

function ScoringModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-2xl overflow-hidden"
        style={{ background: M.bg, border: `1px solid ${M.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${M.border}` }}>
          <h2
            className="text-base uppercase tracking-wider"
            style={{ fontFamily: "var(--font-barlow)", fontWeight: 800, color: M.green }}
          >
            Scoring Explained
          </h2>
          <button
            onClick={onClose}
            className="text-lg leading-none w-7 h-7 flex items-center justify-center rounded-full"
            style={{ color: M.muted, background: M.faint }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div className="px-5 py-4 space-y-6 overflow-y-auto max-h-[72vh] text-xs" style={{ color: M.muted }}>

          {/* How scores work */}
          <p className="leading-relaxed" style={{ color: M.muted }}>
            Each player gets a score from <span style={{ color: M.text, fontWeight: 700 }}>0–100</span>. Both lists are ranked independently — a player can appear in Transfer Out without a direct Transfer In replacement being shown. Scores are recalculated fresh every time you load the page.
          </p>

          {/* Backtesting caveat */}
          <div className="rounded-lg px-3 py-2.5 flex gap-2.5" style={{ background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.25)" }}>
            <span className="shrink-0 mt-px" style={{ color: M.amber }}>⚠</span>
            <p className="leading-relaxed" style={{ color: M.amber }}>
              <span className="font-bold">Not backtested.</span> The component weights are manually tuned heuristics based on FPL conventions and stats theory — they have not been validated against historical gameweek outcomes. Treat the scores as a structured starting point for your own research, not a proven model.
            </p>
          </div>

          {/* Score bar colours */}
          <section>
            <p className="font-black text-[11px] uppercase tracking-widest mb-2" style={{ color: M.text }}>Score bar colours</p>
            <div className="space-y-1.5">
              {([
                ["Out ≥ 70", M.red,       "Urgent — strong case to sell"],
                ["Out 45–69", M.amber,    "Moderate concern, worth monitoring"],
                ["Out < 45",  M.slate,    "Low priority"],
                ["In ≥ 65",  "#15803d",   "Strong pickup — act now"],
                ["In 45–64", M.amber,     "Decent option"],
                ["In < 45",  M.slate,     "Low priority"],
              ] as [string, string, string][]).map(([label, color, desc]) => (
                <div key={label} className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                  <span className="font-bold w-20 shrink-0 tabular-nums" style={{ color }}>{label}</span>
                  <span style={{ color: M.muted }}>{desc}</span>
                </div>
              ))}
            </div>
          </section>

          <div style={{ borderTop: `1px solid ${M.border}` }} />

          {/* ── Transfer Out ── */}
          <section className="space-y-3">
            <p className="font-black text-[11px] uppercase tracking-widest" style={{ color: M.red }}>
              Transfer Out score — 6 components
            </p>
            <p className="leading-relaxed">
              Higher = stronger case to sell. Each component is clamped to its maximum then summed.
            </p>

            {/* Component rows */}
            {([
              {
                pts: "35", label: "Fixture difficulty (FDR)", color: M.red,
                detail: (
                  <>
                    Average FDR across the <strong>next 3 GWs</strong>. Blank gameweeks count as FDR&nbsp;5 (worst).
                    The formula maps the average onto 0–35:
                    <code className="block mt-1 px-2 py-1 rounded text-[10px]" style={{ background: M.faint, color: M.text }}>
                      score = clamp((avgFDR − 1) / 4) × 35
                    </code>
                    FDR 5 → 35 pts · FDR 3 → 17.5 pts · FDR 1 → 0 pts. This is the single biggest driver — a player facing three FDR 5 fixtures can score 35 here alone.
                  </>
                ),
              },
              {
                pts: "20", label: "Form", color: M.red,
                detail: (
                  <>
                    FPL&apos;s official form figure (rolling average points over the last 5 GWs). Low form pushes the score <em>up</em>:
                    <code className="block mt-1 px-2 py-1 rounded text-[10px]" style={{ background: M.faint, color: M.text }}>
                      score = clamp((6 − form) / 6) × 20
                    </code>
                    Form 0 → 20 pts · Form 6 → 0 pts. A player who has blanked for five weeks scores the full 20.
                  </>
                ),
              },
              {
                pts: "15", label: "Position-specific quality", color: M.red,
                detail: (
                  <>
                    Different stats matter by position:
                    <ul className="mt-1 space-y-1 list-none">
                      <li><strong style={{ color: M.text }}>GK / DEF</strong> — split into two sub-scores:
                        <br />• xGC/90 penalty (8 pts): <code style={{ background: M.faint, color: M.text }} className="px-1 rounded">clamp((xGC/90 − 0.8) / 1.2) × 8</code> — conceding more than 0.8 goals per 90 starts costing points
                        <br />• Defensive contribution/90 penalty (7 pts): <code style={{ background: M.faint, color: M.text }} className="px-1 rounded">clamp((0.5 − defContrib/90) / 0.5) × 7</code> — low tackles/blocks/interceptions per 90 hurts
                      </li>
                      <li className="mt-1"><strong style={{ color: M.text }}>MID / FWD</strong> — one stat:
                        <br /><code style={{ background: M.faint, color: M.text }} className="px-1 rounded">clamp((0.45 − xGI/90) / 0.45) × 15</code> — anything below 0.45 expected goal involvements per 90 scores points here
                      </li>
                    </ul>
                  </>
                ),
              },
              {
                pts: "15", label: "Availability", color: M.red,
                detail: (
                  <>
                    Based on FPL&apos;s <strong style={{ color: M.text }}>chance of playing next round</strong> (COP) flag. Stepped thresholds:
                    <div className="mt-1 space-y-0.5">
                      {([["0% (out)", "15 pts"], ["25%", "14 pts"], ["50%", "12 pts"], ["75%", "8 pts"], ["null / 100%", "0 pts"]] as [string, string][]).map(([k, v]) => (
                        <div key={k} className="flex gap-3">
                          <span style={{ color: M.text, minWidth: "90px" }}>{k}</span>
                          <span style={{ color: M.red }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    Players with null COP (no concern flagged) score 0 here.
                  </>
                ),
              },
              {
                pts: "8", label: "Form vs season PPG divergence", color: M.red,
                detail: (
                  <>
                    Catches players who look good on season stats but are falling off a cliff recently. Compares season points-per-start to current form:
                    <code className="block mt-1 px-2 py-1 rounded text-[10px]" style={{ background: M.faint, color: M.text }}>
                      seasonPPG = totalPoints / starts
                      <br />
                      score = clamp(max(0, seasonPPG − form) / 6) × 8
                    </code>
                    A player averaging 8 pts/start all season but currently on form 2 scores the full 8.
                  </>
                ),
              },
              {
                pts: "7", label: "xG regression risk", color: M.red,
                detail: (
                  <>
                    <strong style={{ color: M.text }}>MID / FWD only.</strong> Players who have scored significantly more goals than their xG are due a correction:
                    <code className="block mt-1 px-2 py-1 rounded text-[10px]" style={{ background: M.faint, color: M.text }}>
                      xGDiff = goals − xG
                      <br />
                      score = clamp(max(0, xGDiff − 2) / 5) × 7
                    </code>
                    The first 2-goal buffer is free — outperforming by 7+ goals scores the full 7. Defenders and goalkeepers are excluded entirely.
                  </>
                ),
              },
            ] as { pts: string; label: string; color: string; detail: React.ReactNode }[]).map(({ pts, label, color, detail }) => (
              <div key={label} className="rounded-lg p-3 space-y-1.5" style={{ background: M.surface }}>
                <div className="flex items-baseline gap-2">
                  <span className="font-black tabular-nums text-sm" style={{ color }}>{pts}%</span>
                  <span className="font-black text-[11px]" style={{ color: M.text }}>{label}</span>
                </div>
                <div className="leading-relaxed" style={{ color: M.muted }}>{detail}</div>
              </div>
            ))}
          </section>

          <div style={{ borderTop: `1px solid ${M.border}` }} />

          {/* ── Transfer In ── */}
          <section className="space-y-3">
            <p className="font-black text-[11px] uppercase tracking-widest" style={{ color: M.green }}>
              Transfer In score — 7 components
            </p>
            <p className="leading-relaxed">
              Higher = better pickup. Only players with at least 90 minutes played this season and available (status: available or doubtful) are considered.
            </p>

            {([
              {
                pts: "30", label: "Fixture difficulty (FDR)", color: M.green,
                detail: (
                  <>
                    Mirrors the OUT formula but inverted — easy fixtures score high:
                    <code className="block mt-1 px-2 py-1 rounded text-[10px]" style={{ background: M.faint, color: M.text }}>
                      score = clamp((5 − avgFDR) / 4) × 30
                    </code>
                    FDR 1 → 30 pts · FDR 3 → 15 pts · FDR 5 → 0 pts. BGW = FDR 5 = 0 pts.
                  </>
                ),
              },
              {
                pts: "20", label: "Position-specific quality", color: M.green,
                detail: (
                  <>
                    <ul className="space-y-1 list-none">
                      <li><strong style={{ color: M.text }}>GK / DEF</strong> — split:
                        <br />• Low xGC/90 (12 pts): <code style={{ background: M.faint, color: M.text }} className="px-1 rounded">clamp((1.5 − xGC/90) / 1.5) × 12</code>
                        <br />• High defensive contribution/90 (8 pts): <code style={{ background: M.faint, color: M.text }} className="px-1 rounded">clamp(defContrib/90 / 0.8) × 8</code>
                      </li>
                      <li className="mt-1"><strong style={{ color: M.text }}>MID</strong>: <code style={{ background: M.faint, color: M.text }} className="px-1 rounded">clamp(xGI/90 / 0.60) × 20</code></li>
                      <li className="mt-0.5"><strong style={{ color: M.text }}>FWD</strong>: <code style={{ background: M.faint, color: M.text }} className="px-1 rounded">clamp(xGI/90 / 0.70) × 20</code> — FWDs need a slightly higher bar to score full marks</li>
                    </ul>
                  </>
                ),
              },
              {
                pts: "15", label: "Playing time reliability", color: M.green,
                detail: (
                  <>
                    Guards against bringing in a player who barely plays. Scales actual minutes against the maximum minutes possible so far:
                    <code className="block mt-1 px-2 py-1 rounded text-[10px]" style={{ background: M.faint, color: M.text }}>
                      maxExpectedMins = currentGW × 90
                      <br />
                      score = clamp(minutes / maxExpectedMins) × 15
                    </code>
                    A player who has played every minute of every game scores 15. Someone who has played half the available minutes scores ~7.5.
                  </>
                ),
              },
              {
                pts: "12", label: "Form", color: M.green,
                detail: (
                  <>
                    High recent form (last 5 GWs) scores up. Form caps out at 12 before giving full marks:
                    <code className="block mt-1 px-2 py-1 rounded text-[10px]" style={{ background: M.faint, color: M.text }}>
                      score = clamp(form / 12) × 12
                    </code>
                    Form 12 → 12 pts · Form 6 → 6 pts · Form 0 → 0 pts.
                  </>
                ),
              },
              {
                pts: "10", label: "FPL expected points (ep_next)", color: M.green,
                detail: (
                  <>
                    FPL&apos;s own machine-learning projection for the next gameweek. Treated as an independent oracle to cross-check the other signals:
                    <code className="block mt-1 px-2 py-1 rounded text-[10px]" style={{ background: M.faint, color: M.text }}>
                      score = clamp(epNext / 15) × 10
                    </code>
                    ep_next of 15+ → full 10 pts. If FPL projects &lt;15 pts next GW, the score is proportional.
                  </>
                ),
              },
              {
                pts: "8", label: "Transfer momentum", color: M.green,
                detail: (
                  <>
                    Detects &quot;smart money&quot; moving into a player. Calculates transfers in this week relative to current ownership:
                    <code className="block mt-1 px-2 py-1 rounded text-[10px]" style={{ background: M.faint, color: M.text }}>
                      ownedCount = (selectedByPercent / 100) × totalManagers
                      <br />
                      momentum = transfersInThisWeek / ownedCount
                      <br />
                      score = clamp(momentum / 0.20) × 8
                    </code>
                    If 20% of current owners have been transferred in this week, that scores the full 8. Highly owned but stagnant players score near 0.
                  </>
                ),
              },
              {
                pts: "5", label: "Set-piece role", color: M.green,
                detail: (
                  <>
                    Bonuses for dead-ball responsibilities (bonus scoring opportunities beyond 90-minute play):
                    <div className="mt-1 space-y-0.5">
                      {([["Penalty taker (1st)", "+3 pts"], ["Direct free-kick taker (1st)", "+1 pt"], ["Corner / indirect FK taker (1st)", "+1 pt"]] as [string, string][]).map(([k, v]) => (
                        <div key={k} className="flex gap-3">
                          <span style={{ color: M.text, minWidth: "180px" }}>{k}</span>
                          <span style={{ color: M.green }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    Capped at 5 pts total. A player who takes penalties <em>and</em> corners scores 4.
                  </>
                ),
              },
            ] as { pts: string; label: string; color: string; detail: React.ReactNode }[]).map(({ pts, label, color, detail }) => (
              <div key={label} className="rounded-lg p-3 space-y-1.5" style={{ background: M.surface }}>
                <div className="flex items-baseline gap-2">
                  <span className="font-black tabular-nums text-sm" style={{ color }}>{pts}%</span>
                  <span className="font-black text-[11px]" style={{ color: M.text }}>{label}</span>
                </div>
                <div className="leading-relaxed" style={{ color: M.muted }}>{detail}</div>
              </div>
            ))}
          </section>

        </div>
      </div>
    </div>
  );
}

function PlayerListRow({
  player,
  rank,
  variant,
}: {
  player: TransferOutCandidate | TransferInCandidate;
  rank: number;
  variant: "out" | "in";
}) {
  const isGk = player.position === 1;
  const accentColor = variant === "out" ? "#ef4444" : "var(--fpl-green)";
  const scoreColor = variant === "out"
    ? player.score >= 70 ? "#ef4444" : player.score >= 45 ? "#f59e0b" : "#94a3b8"
    : player.score >= 65 ? "#15803d" : player.score >= 45 ? "#f59e0b" : "#94a3b8";

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
      style={{ background: "var(--fpl-bg-surface)", border: "1px solid var(--fpl-border)" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--fpl-bg-main)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--fpl-bg-surface)"; }}
    >
      {/* Rank */}
      <span
        className="text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0"
        style={{ background: variant === "out" ? "rgba(239,68,68,0.12)" : "rgba(0,255,135,0.10)", color: accentColor }}
      >
        {rank}
      </span>

      {/* Kit */}
      <div className="w-7 h-7 shrink-0 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={kitUrl(player.teamCode, isGk)} alt={player.teamShort} className="w-full h-full object-contain" />
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm leading-tight truncate"
          style={{ fontFamily: "var(--font-barlow)", fontWeight: 800, color: "rgb(var(--fpl-text))" }}
        >
          {player.name}
        </p>
        <div className="flex items-center gap-1.5 mt-px">
          <span className="text-[10px] font-bold px-1 py-px rounded" style={{ background: "rgba(255,255,255,0.08)", color: "var(--fpl-muted)" }}>
            {POSITION_LABELS[player.position]}
          </span>
          <span className="text-[10px]" style={{ color: "var(--fpl-muted)" }}>{player.teamShort}</span>
          <span className="text-[10px]" style={{ color: "var(--fpl-muted)" }}>£{player.priceMillion.toFixed(1)}m</span>
        </div>
      </div>

      {/* Form */}
      <div className="hidden sm:flex w-12 shrink-0 items-center justify-center">
        <p
          className="text-sm tabular-nums font-black"
          style={{ fontFamily: "var(--font-barlow)", fontWeight: 800, color: variant === "out" ? (player.form < 3 ? "#ef4444" : "var(--fpl-muted)") : (player.form >= 6 ? "var(--fpl-green)" : "var(--fpl-muted)") }}
        >
          {player.form.toFixed(1)}
        </p>
      </div>

      {/* Total pts */}
      <div className="hidden sm:flex w-12 shrink-0 items-center justify-center">
        <p className="text-sm tabular-nums font-black" style={{ fontFamily: "var(--font-barlow)", fontWeight: 800, color: "rgb(var(--fpl-text))" }}>
          {player.totalPoints}
        </p>
      </div>

      {/* Score */}
      <div className="w-12 shrink-0 flex items-center justify-center">
        <p className="text-sm tabular-nums font-black" style={{ fontFamily: "var(--font-barlow)", fontWeight: 800, color: scoreColor }}>
          {player.score}
        </p>
      </div>
    </div>
  );
}

export default function TransferRecommendations({ outs, ins }: Props) {
  const count = Math.max(outs.length, ins.length);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <div className="space-y-3">
      {showModal && <ScoringModal onClose={() => setShowModal(false)} />}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs" style={{ color: "var(--fpl-muted)" }}>
          Scores weight fixture difficulty, recent form, and underlying stats. Final call is always yours.{" "}
          <button
            onClick={() => setShowModal(true)}
            className="underline underline-offset-2 transition-colors"
            style={{ color: "var(--fpl-accent)" }}
          >
            Scoring explained
          </button>
        </p>

        {/* View toggle */}
        <div
          className="flex items-center shrink-0 rounded overflow-hidden"
          style={{ border: "1px solid var(--fpl-border)" }}
        >
          <button
            onClick={() => setViewMode("grid")}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold transition"
            style={{
              background: viewMode === "grid" ? "var(--fpl-bg-deep)" : "transparent",
              color: viewMode === "grid" ? "white" : "var(--fpl-muted)",
            }}
          >
            {/* Grid icon */}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="0" y="0" width="5" height="5" rx="1" />
              <rect x="7" y="0" width="5" height="5" rx="1" />
              <rect x="0" y="7" width="5" height="5" rx="1" />
              <rect x="7" y="7" width="5" height="5" rx="1" />
            </svg>
            Grid
          </button>
          <button
            onClick={() => setViewMode("list")}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold transition"
            style={{
              background: viewMode === "list" ? "var(--fpl-bg-deep)" : "transparent",
              color: viewMode === "list" ? "white" : "var(--fpl-muted)",
              borderLeft: "1px solid var(--fpl-border)",
            }}
          >
            {/* List icon */}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="4" y1="2" x2="11" y2="2" />
              <line x1="4" y1="6" x2="11" y2="6" />
              <line x1="4" y1="10" x2="11" y2="10" />
              <circle cx="1.5" cy="2" r="1" fill="currentColor" stroke="none" />
              <circle cx="1.5" cy="6" r="1" fill="currentColor" stroke="none" />
              <circle cx="1.5" cy="10" r="1" fill="currentColor" stroke="none" />
            </svg>
            List
          </button>
        </div>
      </div>

      {/* ── List view ── */}
      {viewMode === "list" && (
        <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
          {/* Transfer In list */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded" style={{ background: "rgba(0,255,135,0.12)", color: "var(--fpl-green)" }}>
                Transfer In
              </span>
            </div>
            {/* Column headers */}
            <div className="hidden sm:flex items-center gap-3 px-3 pb-1">
              <span className="w-5 shrink-0" />
              <span className="w-7 shrink-0" />
              <span className="flex-1" />
              <span className="w-12 shrink-0 text-center text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--fpl-muted)" }}>Form</span>
              <span className="w-12 shrink-0 text-center text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--fpl-muted)" }}>Pts</span>
              <span className="w-12 shrink-0 text-center text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--fpl-muted)" }}>Score</span>
            </div>
            <div className="space-y-1.5">
              {ins.map((p, i) => <PlayerListRow key={p.id} player={p} rank={i + 1} variant="in" />)}
            </div>
          </div>

          {/* Transfer Out list */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
                Transfer Out
              </span>
            </div>
            {/* Column headers */}
            <div className="hidden sm:flex items-center gap-3 px-3 pb-1">
              <span className="w-5 shrink-0" />
              <span className="w-7 shrink-0" />
              <span className="flex-1" />
              <span className="w-12 shrink-0 text-center text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--fpl-muted)" }}>Form</span>
              <span className="w-12 shrink-0 text-center text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--fpl-muted)" }}>Pts</span>
              <span className="w-12 shrink-0 text-center text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--fpl-muted)" }}>Score</span>
            </div>
            <div className="space-y-1.5">
              {outs.map((p, i) => <PlayerListRow key={p.id} player={p} rank={i + 1} variant="out" />)}
            </div>
          </div>
        </div>
      )}

      {viewMode === "grid" && <>
      {/* Desktop: flat grid — In left, Out right */}
      <div className="hidden md:grid md:grid-cols-2 md:gap-x-6 md:gap-y-2">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded" style={{ background: "rgba(0,255,135,0.12)", color: "var(--fpl-green)" }}>
            Transfer In
          </span>
          <span className="text-[10px]" style={{ color: "var(--fpl-muted)" }}>best available options</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
            Transfer Out
          </span>
          <span className="text-[10px]" style={{ color: "var(--fpl-muted)" }}>your worst options right now</span>
        </div>

        {/* Card pairs — each In/Out pair sits in the same grid row → equal height */}
        {Array.from({ length: count }).map((_, i) => (
          <React.Fragment key={i}>
            {ins[i] ? (
              <PlayerCard player={ins[i]} rank={i + 1} variant="in" />
            ) : (
              <div />
            )}
            {outs[i] ? (
              <PlayerCard player={outs[i]} rank={i + 1} variant="out" />
            ) : (
              <div />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Mobile: two stacked sections */}
      <div className="md:hidden space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded" style={{ background: "rgba(0,255,135,0.12)", color: "var(--fpl-green)" }}>
              Transfer In
            </span>
            <span className="text-[10px]" style={{ color: "var(--fpl-muted)" }}>best available options</span>
          </div>
          <div className="space-y-2">
            {ins.map((p, i) => <PlayerCard key={p.id} player={p} rank={i + 1} variant="in" />)}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
              Transfer Out
            </span>
            <span className="text-[10px]" style={{ color: "var(--fpl-muted)" }}>your worst options right now</span>
          </div>
          <div className="space-y-2">
            {outs.map((p, i) => <PlayerCard key={p.id} player={p} rank={i + 1} variant="out" />)}
          </div>
        </div>
      </div>
      </>}
    </div>
  );
}

"use client";

import { useState } from "react";
import type { SquadPlayerRow } from "@/types/fpl";
import { fdrStyle } from "./FdrLegend";

interface Props {
  player: SquadPlayerRow;
  selectedGwIndex: number;
  isBench?: boolean;
}

function kitUrl(teamCode: number, isGk: boolean) {
  const suffix = isGk ? "_1" : "";
  return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}${suffix}-110.png`;
}

function FallbackShirt() {
  return (
    <svg viewBox="0 0 40 36" className="w-full h-full" fill="none">
      <path
        d="M13 2 L3 10 L8 14 L8 34 L32 34 L32 14 L37 10 L27 2 C27 2 24 6 20 6 C16 6 13 2 13 2Z"
        fill="var(--fpl-bg-deep)"
        stroke="white"
        strokeWidth="1.2"
      />
      <path d="M16 3 Q20 8 24 3" stroke="white" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export default function PlayerPitchCard({
  player,
  selectedGwIndex,
  isBench = false,
}: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const isGk = player.position === 1;
  const upcomingCell = player.fixtures[selectedGwIndex];
  const fixtures = upcomingCell?.fixtures ?? [];
  const nextFixture = fixtures[0];

  return (
    <div className="group relative flex flex-col items-center gap-0.5 w-[84px] sm:w-[96px] select-none">

      {/* ── Hover tooltip (starters only) ── */}
      {!isBench && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50
                     opacity-0 group-hover:opacity-100 transition-opacity duration-150
                     pointer-events-none w-44"
        >
          <div
            className="rounded-lg p-2.5 shadow-2xl text-left"
            style={{
              background: "#37003c",
              borderTop: "2px solid #00ff87",
            }}
          >
            {(() => {
              const next5 = player.fixtures.slice(selectedGwIndex, selectedGwIndex + 5);
              return next5.length === 0 ? (
                <p className="text-white/50 text-[11px] text-center">No upcoming fixtures</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {next5.map((cell, wi) => (
                    <div key={wi} className="flex items-center gap-1">
                      {/* GW label */}
                      <span className="text-[10px] text-white/50 shrink-0 w-8">
                        GW{cell.gameweek}:
                      </span>
                      {/* Fixture chip(s) */}
                      {cell.fixtures.length === 0 ? (
                        <div className="flex flex-row flex-1 min-w-0">
                          <span className="text-[10px] px-1.5 py-0.5 rounded flex-1 text-center" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)" }}>
                            BGW
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-row gap-0.5 flex-1 min-w-0">
                          {cell.fixtures.map((fix, fi) => (
                            <span
                              key={fi}
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-1 min-w-0 text-center"
                              style={fdrStyle(fix.fdr)}
                            >
                              {fix.opponentShort}({fix.isHome ? "H" : "A"})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
          {/* Arrow */}
          <div
            className="w-2.5 h-2.5 rotate-45 mx-auto -mt-1.5"
            style={{ background: "#37003c" }}
          />
        </div>
      )}

      {/* ── Kit image with C/V badge ── */}
      <div className="relative w-[64px] h-[58px] sm:w-[76px] sm:h-[68px] flex items-center justify-center">
        {player.isCaptain && (
          <span className="absolute top-0 right-0 z-10 w-5 h-5 flex items-center justify-center rounded-full bg-yellow-400 text-yellow-900 text-[11px] font-black leading-none shadow">
            C
          </span>
        )}
        {player.isViceCaptain && (
          <span
            className="absolute top-0 right-0 z-10 w-5 h-5 flex items-center justify-center rounded-full text-[11px] font-black leading-none shadow"
            style={{ background: "rgba(255,255,255,0.85)", color: "#37003c", border: "1px solid rgba(255,255,255,0.5)" }}
          >
            V
          </span>
        )}
        {!imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={kitUrl(player.teamCode, isGk)}
            alt={player.teamShort}
            className="w-full h-full object-contain drop-shadow-lg"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <FallbackShirt />
        )}
      </div>

      {/* ── Name chip ── */}
      <div
        className="text-white px-1.5 py-1 rounded text-center leading-tight w-full truncate bg-[#37003c]"
        style={{ fontFamily: "var(--font-barlow)", fontWeight: 800, fontSize: "13px" }}
        title={player.name}
      >
        {player.name}
      </div>

      {/* ── Fixture chips ── */}
      {fixtures.length > 0 ? (
        <div className="flex flex-row gap-0.5 w-full">
          {fixtures.map((fix, i) => (
            <div
              key={i}
              className="text-[10px] font-bold px-1 py-0.5 rounded flex-1 min-w-0 text-center leading-tight"
              style={fdrStyle(fix.fdr)}
            >
              {fix.opponentShort}({fix.isHome ? "H" : "A"})
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[11px] text-white/50 w-full text-center">BGW</div>
      )}
    </div>
  );
}

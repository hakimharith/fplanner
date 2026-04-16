import type { SquadPlayerRow } from "@/types/fpl";
import { POSITION_LABELS } from "@/types/fpl";
import { fdrStyle } from "./FdrLegend";

interface Props {
  player: SquadPlayerRow;
  gameweeks: number[];
  isBench: boolean;
}

export default function PlayerRow({ player, gameweeks, isBench }: Props) {
  return (
    <tr
      style={{
        borderBottom: "1px solid var(--fpl-border)",
        opacity: 1,
      }}
    >
      {/* Position */}
      <td
        className="sticky left-0 z-10 px-2 py-1.5 text-xs font-bold w-10"
        style={{ background: "var(--fpl-bg-main)", color: "var(--fpl-muted)" }}
      >
        {POSITION_LABELS[player.position]}
      </td>

      {/* Player name */}
      <td
        className="sticky left-10 z-10 px-2 py-1.5 min-w-[130px] max-w-[160px]"
        style={{ background: "var(--fpl-bg-main)" }}
      >
        <div className="flex items-center gap-1">
          <span
            className="text-sm font-semibold truncate"
            style={{ color: "rgb(var(--fpl-text))" }}
          >
            {player.name}
          </span>
          {player.isCaptain && (
            <span className="text-xs bg-yellow-400 text-yellow-900 rounded px-1 font-bold">C</span>
          )}
          {player.isViceCaptain && (
            <span
              className="text-xs rounded px-1 font-bold"
              style={{ background: "var(--fpl-border-strong)", color: "rgb(var(--fpl-text))" }}
            >
              V
            </span>
          )}
        </div>
        <div className="text-xs" style={{ color: "var(--fpl-muted)" }}>
          {player.teamShort}
        </div>
      </td>

      {/* Form & Points */}
      <td
        className="sticky left-[170px] z-10 px-2 py-1.5 text-center min-w-[80px]"
        style={{ background: "var(--fpl-bg-main)", borderRight: "1px solid var(--fpl-border)", boxShadow: "4px 0 16px rgba(0,0,0,0.45)" }}
      >
        <div className="text-sm font-bold" style={{ color: "var(--fpl-accent)" }}>
          {player.totalPoints}
        </div>
        <div className="text-xs" style={{ color: "var(--fpl-muted)" }}>
          Form: {player.form}
        </div>
      </td>

      {/* Fixture cells */}
      {gameweeks.map((gw, i) => {
        const cell = player.fixtures[i];
        const fixtures = cell?.fixtures ?? [];

        if (fixtures.length === 0) {
          return (
            <td key={gw} className="px-1 py-1.5 text-center">
              <span className="text-xs" style={{ color: "var(--fpl-muted)" }}>—</span>
            </td>
          );
        }

        return (
          <td key={gw} className="px-1 py-1 text-center min-w-[70px]">
            <div className="flex flex-col gap-0.5">
              {fixtures.map((fix, fi) => (
                <span
                  key={fi}
                  className="text-xs font-semibold rounded px-1.5 py-0.5 inline-block"
                  style={fdrStyle(fix.fdr)}
                >
                  {fix.opponentShort} ({fix.isHome ? "H" : "A"})
                </span>
              ))}
            </div>
          </td>
        );
      })}
    </tr>
  );
}

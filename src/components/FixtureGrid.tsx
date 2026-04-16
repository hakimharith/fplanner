import type { SquadPlayerRow } from "@/types/fpl";
import PlayerRow from "./PlayerRow";

interface Props {
  players: SquadPlayerRow[];
  gameweeks: number[];
  currentGw: number;
}

export default function FixtureGrid({ players, gameweeks, currentGw }: Props) {
  const starters = players.filter((_, i) => i < 11);
  const bench = players.filter((_, i) => i >= 11);

  return (
    <div
      className="overflow-x-auto rounded-lg shadow-sm"
      style={{ border: "1px solid var(--fpl-border)" }}
    >
      <table className="min-w-max w-full text-sm border-collapse">
        <thead>
          <tr style={{ background: "var(--fpl-bg-surface)", borderBottom: "1px solid var(--fpl-border)" }}>
            <th
              className="sticky left-0 z-20 px-2 py-2 text-left text-xs font-semibold w-10"
              style={{ background: "var(--fpl-bg-surface)", color: "var(--fpl-muted)" }}
            >
              Pos
            </th>
            <th
              className="sticky left-10 z-20 px-2 py-2 text-left text-xs font-semibold min-w-[130px]"
              style={{ background: "var(--fpl-bg-surface)", color: "var(--fpl-muted)" }}
            >
              Player
            </th>
            <th
              className="sticky left-[170px] z-20 px-2 py-2 text-center text-xs font-semibold min-w-[80px]"
              style={{ background: "var(--fpl-bg-surface)", color: "var(--fpl-muted)", borderRight: "1px solid var(--fpl-border)", boxShadow: "4px 0 16px rgba(0,0,0,0.45)" }}
            >
              Pts / Form
            </th>
            {gameweeks.map((gw) => (
              <th
                key={gw}
                className="px-1 py-2 text-center text-xs font-semibold min-w-[70px]"
                style={{
                  color: gw === currentGw ? "var(--fpl-accent)" : "var(--fpl-muted)",
                  background: gw === currentGw ? "var(--fpl-border)" : undefined,
                }}
              >
                GW{gw}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {starters.map((p) => (
            <PlayerRow key={p.id} player={p} gameweeks={gameweeks} isBench={false} />
          ))}
          <tr>
            <td
              colSpan={3 + gameweeks.length}
              className="py-1 px-3 text-xs font-semibold uppercase tracking-wide"
              style={{ background: "var(--fpl-bg-surface)", color: "var(--fpl-muted)" }}
            >
              Bench
            </td>
          </tr>
          {bench.map((p) => (
            <PlayerRow key={p.id} player={p} gameweeks={gameweeks} isBench={true} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

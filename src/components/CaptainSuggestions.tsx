import type { CaptainSuggestion } from "@/types/fpl";
import { fdrStyle } from "./FdrLegend";

interface Props {
  suggestions: CaptainSuggestion[];
  currentGw: number;
}

export default function CaptainSuggestions({ suggestions, currentGw }: Props) {
  // Show next 6 GWs by default (scrollable chips for all)
  const preview = suggestions.slice(0, 6);

  return (
    <div>
      <h2 className="text-base font-semibold text-gray-700 mb-3">
        Captain Suggestions
      </h2>
      <div className="flex flex-wrap gap-3">
        {preview.map((s) => (
          <div
            key={s.gameweek}
            className="flex flex-col items-center bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm min-w-[100px]"
          >
            <span
              className={`text-xs font-bold mb-1 ${
                s.gameweek === currentGw ? "text-purple-700" : "text-gray-400"
              }`}
            >
              GW{s.gameweek}
            </span>
            <span className="text-sm font-bold text-gray-800">
              {s.playerName}
            </span>
            <span
              className="mt-1 text-xs font-semibold rounded px-2 py-0.5"
              style={fdrStyle(Math.round(s.avgFdr))}
            >
              vs {s.opponentShort} ({s.isHome ? "H" : "A"})
            </span>
            <span className="text-xs text-gray-400 mt-1">
              FDR {s.avgFdr.toFixed(1)} · {s.totalPoints}pts
            </span>
          </div>
        ))}
      </div>
      {suggestions.length > 6 && (
        <p className="text-xs text-gray-400 mt-2">
          +{suggestions.length - 6} more gameweeks in the fixture grid above
        </p>
      )}
    </div>
  );
}

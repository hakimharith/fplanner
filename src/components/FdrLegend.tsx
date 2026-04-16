import type React from "react";

const FDR_COLORS: Record<number, { bg: string; color: string }> = {
  1: { bg: "#15803d", color: "white" },
  2: { bg: "#4ade80", color: "#14532d" },
  3: { bg: "#fde047", color: "#713f12" },
  4: { bg: "#fb923c", color: "white" },
  5: { bg: "#dc2626", color: "white" },
};

/** Returns background + text + optional glow as a single inline style object. */
export function fdrStyle(fdr: number): React.CSSProperties {
  const colors = FDR_COLORS[fdr] ?? { bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" };
  return {
    background: colors.bg,
    color: colors.color,
    ...(fdr === 5 ? { boxShadow: "0 0 8px rgba(220,38,38,0.6)" } : {}),
  };
}

/** @deprecated Use fdrStyle() instead — returns combined bg + text + glow. */
export function fdrClass(_fdr: number): string {
  return "";
}

/** @deprecated Merged into fdrStyle(). */
export function fdrGlowStyle(fdr: number): React.CSSProperties {
  return fdr === 5 ? { boxShadow: "0 0 8px rgba(220,38,38,0.6)" } : {};
}

export default function FdrLegend() {
  const items = [
    { fdr: 1, label: "Very Easy" },
    { fdr: 2, label: "Easy" },
    { fdr: 3, label: "Medium" },
    { fdr: 4, label: "Hard" },
    { fdr: 5, label: "Very Hard" },
  ];

  return (
    <div className="flex flex-wrap gap-2 items-center text-xs">
      <span className="font-semibold" style={{ color: "var(--fpl-muted)" }}>FDR:</span>
      {items.map(({ fdr, label }) => (
        <span
          key={fdr}
          className="px-2 py-0.5 rounded font-medium"
          style={fdrStyle(fdr)}
        >
          {fdr} — {label}
        </span>
      ))}
    </div>
  );
}

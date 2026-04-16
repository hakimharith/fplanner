import Link from "next/link";

interface League {
  id: number;
  name: string;
  entryRank: number;
  lastRank: number;
}

interface Props {
  teamName: string;
  managerName: string;
  overallPoints: number;
  overallRank: number;
  gwPoints: number;
  gwNumber: number;
  currentGw: number;
  nextGw: number;
  squadValue: number;
  bank: number;
  leagues: League[];
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 40 46" className="w-9 h-10 shrink-0" fill="none">
      <path
        d="M20 2L4 9v14c0 10.5 6.8 20.3 16 23 9.2-2.7 16-12.5 16-23V9L20 2z"
        fill="rgba(255,255,255,0.12)"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1.5"
      />
      <path
        d="M20 13v10M15 18h10"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] font-bold uppercase tracking-widest mb-3"
      style={{ color: "var(--fpl-muted)" }}
    >
      {children}
    </p>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-baseline justify-between px-6 py-1.5 border-b"
      style={{ borderColor: "var(--fpl-border)" }}
    >
      <span className="text-[12px]" style={{ color: "var(--fpl-muted)" }}>
        {label}
      </span>
      <span
        className="tabular-nums"
        style={{
          fontFamily: "var(--font-barlow)",
          fontWeight: 800,
          fontSize: "0.9rem",
          color: "rgb(var(--fpl-text))",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function RankMovement({ entryRank, lastRank }: { entryRank: number; lastRank: number }) {
  if (lastRank === 0) {
    // New entry — no previous rank to compare
    return <span style={{ color: "var(--fpl-muted)" }}>—</span>;
  }

  if (entryRank < lastRank) {
    // Rank number decreased = improved position
    return (
      <span
        className="flex items-center gap-0.5 text-xs font-bold"
        style={{ color: "#16a34a" }}
        aria-label="Rank improved"
      >
        <svg viewBox="0 0 10 10" className="w-3 h-3" fill="none">
          <path d="M5 2L9 8H1L5 2Z" fill="currentColor" />
        </svg>
        {(lastRank - entryRank).toLocaleString()}
      </span>
    );
  }

  if (entryRank > lastRank) {
    // Rank number increased = dropped position
    return (
      <span
        className="flex items-center gap-0.5 text-xs font-bold"
        style={{ color: "#f87171" }}
        aria-label="Rank dropped"
      >
        <svg viewBox="0 0 10 10" className="w-3 h-3" fill="none">
          <path d="M5 8L1 2H9L5 8Z" fill="currentColor" />
        </svg>
        {(entryRank - lastRank).toLocaleString()}
      </span>
    );
  }

  return (
    <span className="text-xs" style={{ color: "var(--fpl-muted)" }}>
      —
    </span>
  );
}

export default function TeamSidebar({
  teamName,
  managerName,
  overallPoints,
  overallRank,
  gwPoints,
  gwNumber,
  currentGw,
  nextGw,
  squadValue,
  bank,
  leagues,
}: Props) {
  const topLeagues = leagues.slice(0, 5);

  return (
    <aside
      className="w-full shrink-0 flex flex-col"
      style={{
        background: "var(--fpl-bg-sidebar)",
        borderRight: "1px solid var(--fpl-border)",
        minHeight: "100%",
      }}
    >
      {/* ── Team identity ─────────────────────────────────────── */}
      <div
        className="px-6 py-5 flex items-center gap-4"
        style={{
          background: "#37003c",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <ShieldIcon />
        <div className="min-w-0">
          <h2
            className="text-white leading-tight truncate"
            style={{
              fontFamily: "var(--font-barlow)",
              fontWeight: 800,
              fontSize: "1.35rem",
            }}
          >
            {teamName}
          </h2>
          <p className="text-sm mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.5)" }}>
            {managerName}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[10px] font-semibold mt-1.5 rounded-full px-2 py-0.5 transition-colors duration-150"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            <span aria-hidden="true">←</span>
            <span>Analyze a different team</span>
          </Link>
        </div>
      </div>

      {/* ── Points & Rankings ─────────────────────────────────── */}
      <div className="pt-5 pb-2">
        <div className="flex items-center justify-between px-6 mb-1">
          <SectionHeading>Points &amp; Rankings</SectionHeading>
          <span
            className="text-[10px] font-bold uppercase tracking-widest mb-3"
            style={{ color: "var(--fpl-accent)" }}
          >
            GW{nextGw}
          </span>
        </div>
        <StatRow label="Overall Pts" value={overallPoints.toLocaleString()} />
        <StatRow label="Overall Rank" value={overallRank.toLocaleString()} />
        <StatRow label={`GW${gwNumber} Pts`} value={gwPoints.toLocaleString()} />
      </div>

      {/* ── League Positions ──────────────────────────────────── */}
      {topLeagues.length > 0 && (
        <div className="pt-5 pb-2">
          <div className="px-6 mb-1">
            <SectionHeading>League Positions</SectionHeading>
          </div>
          {topLeagues.map((league) => (
            <div
              key={league.id}
              className="flex items-center px-6 py-1.5 border-b"
              style={{ borderColor: "var(--fpl-border)" }}
            >
              {/* League name */}
              <span
                className="flex-1 min-w-0 text-[12px] truncate pr-3"
                style={{ color: "var(--fpl-muted)" }}
              >
                {league.name}
              </span>

              {/* Rank + movement */}
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="tabular-nums"
                  style={{
                    fontFamily: "var(--font-barlow)",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    color: "rgb(var(--fpl-text))",
                  }}
                >
                  {league.entryRank.toLocaleString()}
                </span>
                <RankMovement entryRank={league.entryRank} lastRank={league.lastRank} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Finance ───────────────────────────────────────────── */}
      <div className="pt-5 pb-2">
        <div className="px-6 mb-1">
          <SectionHeading>Finance</SectionHeading>
        </div>
        <StatRow label="Squad Value" value={`£${squadValue.toFixed(1)}m`} />
        <StatRow label="Money in Bank" value={`£${bank.toFixed(1)}m`} />
      </div>

      {/* ── Fixture Difficulty — pinned to bottom ─────────────── */}
      <div className="hidden lg:block px-6 py-5 mt-auto">
        <SectionHeading>Fixture Difficulty</SectionHeading>
        <div className="space-y-2">
          {[
            { fdr: 1, label: "Very Easy", bg: "#15803d", text: "white" },
            { fdr: 2, label: "Easy",      bg: "#4ade80", text: "#14532d" },
            { fdr: 3, label: "Medium",    bg: "#fde047", text: "#713f12" },
            { fdr: 4, label: "Hard",      bg: "#fb923c", text: "white" },
            { fdr: 5, label: "Very Hard", bg: "#dc2626", text: "white" },
          ].map(({ fdr, label, bg, text }) => (
            <div key={fdr} className="flex items-center gap-3">
              <span
                className="w-7 h-6 rounded text-[11px] font-black flex items-center justify-center shrink-0"
                style={{ background: bg, color: text }}
              >
                {fdr}
              </span>
              <span className="text-[13px]" style={{ color: "var(--fpl-muted)" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

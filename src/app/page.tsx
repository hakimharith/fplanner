"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [teamId, setTeamId] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = teamId.trim();
    if (!trimmed || !/^\d+$/.test(trimmed)) {
      setError("Please enter a valid numeric FPL team ID.");
      return;
    }
    setError("");
    router.push(`/team/${trimmed}`);
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: "var(--fpl-bg-deep)" }}
    >
      <div className="w-full max-w-md">
        {/* ── Logo ── */}
        <div className="text-center mb-8">
          {/* Badge */}
          <div className="logo-badge flex justify-center mb-5">
            <div className="relative">
              {/* Radial glow behind the badge */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: "-28px",
                  background: "radial-gradient(ellipse at 50% 55%, rgba(0,255,135,0.18) 0%, transparent 68%)",
                  pointerEvents: "none",
                }}
              />
              <svg
                viewBox="0 0 72 82"
                width="96"
                height="110"
                fill="none"
                aria-label="FPLanner logo"
                style={{ position: "relative", filter: "drop-shadow(0 8px 24px rgba(0,255,135,0.22))" }}
              >
                {/* Shield fill */}
                <path
                  d="M36 78 C10 68 4 50 4 36 V12 Q4 4 12 4 H60 Q68 4 68 12 V36 C68 50 62 68 36 78Z"
                  fill="#37003c"
                />
                {/* Inner border */}
                <path
                  d="M36 73 C13 64 8 48 8 36 V14 Q8 8 14 8 H58 Q64 8 64 14 V36 C64 48 59 64 36 73Z"
                  fill="none"
                  stroke="rgba(0,255,135,0.22)"
                  strokeWidth="0.8"
                />
                {/* Outer shield border */}
                <path
                  d="M36 78 C10 68 4 50 4 36 V12 Q4 4 12 4 H60 Q68 4 68 12 V36 C68 50 62 68 36 78Z"
                  fill="none"
                  stroke="#00ff87"
                  strokeWidth="1.6"
                />
                {/* Top accent plate */}
                <rect x="20" y="4" width="32" height="5" fill="#00ff87" />

                {/* Subtle pitch halfway line */}
                <line x1="10" y1="43" x2="62" y2="43" stroke="rgba(0,255,135,0.15)" strokeWidth="0.8" />

                {/* ── Formation: 4-3-3 (top = FWD, bottom = GK) ── */}
                {/* FWD row — brightest, 180ms delay */}
                {([
                  [22, 20], [36, 18], [50, 20],
                ] as [number, number][]).map(([cx, cy], i) => (
                  <circle
                    key={`fwd-${i}`}
                    cx={cx} cy={cy} r="2.8"
                    fill="#00ff87"
                    style={{ animation: `logo-dot-in 350ms ease-out ${160 + i * 45}ms both` }}
                  />
                ))}
                {/* MID row — 85% opacity, 360ms base delay */}
                {([
                  [22, 34], [36, 32], [50, 34],
                ] as [number, number][]).map(([cx, cy], i) => (
                  <circle
                    key={`mid-${i}`}
                    cx={cx} cy={cy} r="2.5"
                    fill="#00ff87"
                    style={{ animation: `logo-dot-in 350ms ease-out ${295 + i * 45}ms both`, opacity: 0.82 }}
                  />
                ))}
                {/* DEF row — 60% opacity, 540ms base delay */}
                {([
                  [16, 50], [28, 48], [44, 48], [56, 50],
                ] as [number, number][]).map(([cx, cy], i) => (
                  <circle
                    key={`def-${i}`}
                    cx={cx} cy={cy} r="2.3"
                    fill="#00ff87"
                    style={{ animation: `logo-dot-in 350ms ease-out ${430 + i * 40}ms both`, opacity: 0.62 }}
                  />
                ))}
                {/* GK — 40% opacity, 720ms delay */}
                <circle
                  cx="36" cy="63" r="2.5"
                  fill="#00ff87"
                  style={{ animation: "logo-dot-in 350ms ease-out 600ms both", opacity: 0.42 }}
                />
              </svg>
            </div>
          </div>

          {/* Wordmark */}
          <h1
            className="logo-title"
            style={{
              fontFamily: "var(--font-barlow)",
              fontWeight: 800,
              fontSize: "3rem",
              letterSpacing: "-0.01em",
              lineHeight: 1,
            }}
          >
            <span style={{ color: "#00ff87" }}>FPL</span>
            <span style={{ color: "white" }}>anner</span>
          </h1>

          <p className="logo-sub text-sm mt-3" style={{ color: "var(--fpl-muted)" }}>
            Your tactical squad companion
          </p>
        </div>

        <div
          className="rounded-2xl shadow-2xl overflow-hidden"
          style={{
            background: "var(--fpl-bg-surface)",
            border: "1px solid var(--fpl-border)",
          }}
        >
          <div
            className="px-6 py-4"
            style={{ background: "var(--fpl-accent)" }}
          >
            <p className="text-sm font-bold" style={{ color: "var(--fpl-bg-deep)" }}>
              Enter your FPL Team ID
            </p>
          </div>

          <div className="px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="teamId" className="sr-only">
                  FPL Team ID
                </label>
                <input
                  id="teamId"
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 1234567"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="w-full rounded-lg px-4 py-3 text-base outline-none transition"
                  style={{
                    background: "var(--fpl-bg-main)",
                    color: "rgb(var(--fpl-text))",
                    border: "2px solid var(--fpl-border)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--fpl-accent)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--fpl-border)";
                  }}
                />
                {error && (
                  <p className="text-xs mt-1.5" style={{ color: "#ef4444" }}>
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full font-bold py-3 rounded-lg transition text-sm tracking-wide"
                style={{ background: "var(--fpl-bg-deep)", color: "white" }}
              >
                Preview Fixtures →
              </button>
            </form>

            <p
              className="text-xs text-center mt-5"
              style={{ color: "var(--fpl-muted)" }}
            >
              Find your ID at fantasy.premierleague.com → Points → your team name → check the URL
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

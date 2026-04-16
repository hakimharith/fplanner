"use client";

import { useEffect, useState } from "react";

const PHRASES = [
  "Checking the lineup…",
  "Scouting the opposition…",
  "Reading the match report…",
  "Consulting the gaffer…",
  "Studying the fixtures…",
  "Analysing form…",
  "Setting up the formation…",
  "Checking VAR…",
  "Lacing the boots…",
  "Warming up on the touchline…",
  "Reviewing the tactics board…",
  "Calling for the ball…",
];

export default function FootballLoader() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out → swap → fade in
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % PHRASES.length);
        setVisible(true);
      }, 300);
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: "var(--fpl-bg-main)" }}>
      {/* Ball spinner */}
      <div className="relative w-14 h-14">
        <div
          className="absolute inset-0 rounded-full border-4 border-white/10"
        />
        <div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#00ff87]"
          style={{ animation: "spin 0.9s linear infinite" }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-2xl select-none">
          ⚽
        </div>
      </div>

      {/* Cycling phrase */}
      <p
        className="text-center tracking-wide transition-opacity duration-300"
        style={{
          fontFamily: "var(--font-barlow)",
          fontWeight: 800,
          fontSize: "1.3rem",
          color: "rgb(var(--fpl-text))",
          opacity: visible ? 1 : 0,
          minHeight: "2rem",
        }}
      >
        {PHRASES[index]}
      </p>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      role="switch"
      aria-checked={isLight}
      className="flex items-center gap-2 select-none group"
    >
      <span className="text-white/40 text-[11px] font-semibold hidden sm:inline">
        {isLight ? "Light" : "Dark"}
      </span>
      {/* Track */}
      <div
        className="relative w-10 h-[22px] rounded-full transition-colors duration-300"
        style={{ background: isLight ? "#00ff87" : "rgba(255,255,255,0.15)" }}
      >
        {/* Thumb */}
        <div
          className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-all duration-300"
          style={{ left: isLight ? "calc(100% - 19px)" : "3px" }}
        />
      </div>
    </button>
  );
}

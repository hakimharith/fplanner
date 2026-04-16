"use client";

import Link from "next/link";
import { useState } from "react";

export default function NavBackButton() {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href="/"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-white rounded-full px-3 py-1.5 transition-colors duration-150"
      style={{
        background: hovered ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.08)",
        border: hovered ? "1px solid rgba(255,255,255,0.30)" : "1px solid rgba(255,255,255,0.15)",
      }}
    >
      <span aria-hidden="true">←</span>
      <span>Analyze a different team</span>
    </Link>
  );
}

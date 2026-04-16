"use client";

import { useEffect, useState } from "react";

interface Props {
  deadline: string; // ISO date string from FPL API
  nextGw: number;
}

function getTimeLeft(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function CountdownClock({ deadline, nextGw }: Props) {
  // Start as undefined so SSR and the initial client render both produce nothing,
  // avoiding the seconds-level hydration mismatch.
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft> | undefined>(undefined);

  useEffect(() => {
    // Populate immediately on mount, then tick every second.
    setTimeLeft(getTimeLeft(deadline));
    const id = setInterval(() => {
      setTimeLeft(getTimeLeft(deadline));
    }, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  // Not yet mounted — render a stable placeholder that matches the server HTML.
  if (timeLeft === undefined) {
    return (
      <span className="text-xs uppercase tracking-widest font-bold" style={{ color: "var(--fpl-muted)" }}>
        Deadline
      </span>
    );
  }

  if (!timeLeft) {
    return (
      <span className="text-xs font-semibold" style={{ color: "var(--fpl-accent)" }}>
        GW{nextGw} underway
      </span>
    );
  }

  const { days, hours, minutes, seconds } = timeLeft;
  // Urgent = less than 1 hour left
  const isUrgent = days === 0 && hours === 0;

  const localDeadline = new Date(deadline).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <div className="flex flex-col items-end gap-0.5">
      <div className="flex items-center gap-1.5">
        <span className="text-xs uppercase tracking-widest font-bold" style={{ color: isUrgent ? "#ef4444" : "var(--fpl-muted)" }}>
          {isUrgent ? "Closing!" : "Deadline"}
        </span>
        <div className="flex items-center gap-1">
          {days > 0 && (
            <>
              <Segment value={days} label="d" isUrgent={false} />
              <Colon isUrgent={false} />
            </>
          )}
          {(days > 0 || hours > 0) && (
            <>
              <Segment value={hours} label="h" isUrgent={isUrgent} />
              <Colon isUrgent={isUrgent} />
            </>
          )}
          <Segment value={minutes} label="m" isUrgent={isUrgent} />
          <Colon isUrgent={isUrgent} />
          <Segment value={seconds} label="s" isUrgent={isUrgent} />
        </div>
      </div>
      <span className="text-[11px]" style={{ color: "var(--fpl-muted)" }}>
        {localDeadline}
      </span>
    </div>
  );
}

function Segment({ value, label, isUrgent }: { value: number; label: string; isUrgent: boolean }) {
  return (
    <span
      className="inline-flex items-baseline gap-px tabular-nums"
      style={{
        fontFamily: "var(--font-barlow)",
        fontWeight: 800,
        fontSize: "1rem",
        color: isUrgent ? "#ef4444" : "rgb(var(--fpl-text))",
      }}
    >
      {pad(value)}
      <span className="text-[9px] font-bold" style={{ color: isUrgent ? "rgba(239,68,68,0.7)" : "var(--fpl-muted)" }}>
        {label}
      </span>
    </span>
  );
}

function Colon({ isUrgent }: { isUrgent: boolean }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-barlow)",
        fontWeight: 800,
        fontSize: "1rem",
        color: isUrgent ? "rgba(239,68,68,0.7)" : "var(--fpl-muted)",
      }}
    >
      :
    </span>
  );
}


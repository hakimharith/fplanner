"use client";

import { useEffect, useState } from "react";
import type { SquadPlayerRow, FplPlayerPool } from "@/types/fpl";
import PlanPitchView from "./PlanPitchView";
import PlayerSelectionSidebar from "./PlayerSelectionSidebar";

type PlanTransfer = {
  outId: number;
  inPlayer: FplPlayerPool;
};

interface Props {
  players: SquadPlayerRow[];
  playerPool: FplPlayerPool[];
  gwIndex: number;
  teamId: string;
  bank: number; // in £millions e.g. 1.2 = £1.2m
  onTransferCountChange: (count: number) => void;
}

function loadFromStorage(teamId: string): PlanTransfer[] {
  try {
    const raw = localStorage.getItem(`fpl-plan-${teamId}`);
    if (!raw) return [];
    return JSON.parse(raw) as PlanTransfer[];
  } catch {
    return [];
  }
}

function saveToStorage(teamId: string, transfers: PlanTransfer[]) {
  try {
    localStorage.setItem(`fpl-plan-${teamId}`, JSON.stringify(transfers));
  } catch {
    // ignore
  }
}

export default function PlanTab({
  players,
  playerPool,
  gwIndex,
  teamId,
  bank,
  onTransferCountChange,
}: Props) {
  const [transfers, setTransfers] = useState<PlanTransfer[]>([]);
  // selectedSlotIndex — which slot the sidebar is focused on (drives position filter)
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  // pendingSlots — all slots marked for replacement (greyed on pitch)
  const [pendingSlots, setPendingSlots] = useState<Set<number>>(new Set());

  useEffect(() => {
    const saved = loadFromStorage(teamId);
    setTransfers(saved);
    onTransferCountChange(saved.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  // Build effective players (apply transfers)
  const effectivePlayers: SquadPlayerRow[] = players.map((p) => {
    const transfer = transfers.find((t) => t.outId === p.id);
    if (!transfer) return p;
    const inn = transfer.inPlayer;
    return {
      id: inn.id,
      name: inn.name,
      teamId: inn.teamId,
      teamCode: inn.teamCode,
      teamShort: inn.teamShort,
      position: inn.position,
      form: inn.form,
      totalPoints: inn.totalPoints,
      nowCost: inn.nowCost,
      isCaptain: false,
      isViceCaptain: false,
      isStarter: p.isStarter,
      fixtures: inn.fixtures,
    } satisfies SquadPlayerRow;
  });

  const originalPlayerIds = players.map((p) => p.id);
  const plannedInIds = new Set(transfers.map((t) => t.inPlayer.id));
  const squadPlayerIds = new Set(effectivePlayers.map((p) => p.id));

  function updateTransfers(next: PlanTransfer[]) {
    setTransfers(next);
    saveToStorage(teamId, next);
    onTransferCountChange(next.length);
  }

  function handlePlayerClick(slotIndex: number) {
    const originalId = originalPlayerIds[slotIndex];
    const hasTransfer = transfers.some((t) => t.outId === originalId);
    if (hasTransfer) {
      // Revert an existing transfer
      const next = transfers.filter((t) => t.outId !== originalId);
      updateTransfers(next);
      if (selectedSlotIndex === slotIndex) setSelectedSlotIndex(null);
    } else if (pendingSlots.has(slotIndex)) {
      // Toggle off: remove from pending (cancel selection for this slot)
      const next = new Set(pendingSlots);
      next.delete(slotIndex);
      setPendingSlots(next);
      if (selectedSlotIndex === slotIndex) {
        const remaining = [...next];
        setSelectedSlotIndex(remaining.length > 0 ? remaining[remaining.length - 1] : null);
      }
    } else {
      // Mark this slot for replacement and make it the active sidebar slot
      const next = new Set(pendingSlots);
      next.add(slotIndex);
      setPendingSlots(next);
      setSelectedSlotIndex(slotIndex);
    }
  }

  function applyTransfer(inPlayer: FplPlayerPool) {
    // Find the target slot: prefer selectedSlotIndex if position matches, else any pending slot with matching position
    let targetSlotIndex: number | null = selectedSlotIndex;
    if (targetSlotIndex === null || players[targetSlotIndex]?.position !== inPlayer.position) {
      targetSlotIndex = [...pendingSlots].find((i) => players[i]?.position === inPlayer.position) ?? null;
    }
    if (targetSlotIndex === null) return;
    const outPlayer = players[targetSlotIndex];
    const next = [...transfers.filter((t) => t.outId !== outPlayer.id), { outId: outPlayer.id, inPlayer }];
    updateTransfers(next);
    const nextPending = new Set(pendingSlots);
    nextPending.delete(targetSlotIndex);
    setPendingSlots(nextPending);
    const remaining = [...nextPending];
    setSelectedSlotIndex(remaining.length > 0 ? remaining[remaining.length - 1] : null);
  }

  function handleRemovePlanned(inPlayerId: number) {
    const next = transfers.filter((t) => t.inPlayer.id !== inPlayerId);
    updateTransfers(next);
  }

  function resetPlan() {
    updateTransfers([]);
    setSelectedSlotIndex(null);
    setPendingSlots(new Set());
  }

  // Positions of all pending slots — drives sidebar multi-position filter
  const selectedPositions = [...pendingSlots]
    .map((i) => players[i]?.position)
    .filter((p): p is number => p != null);

  // Transfer cost calculations — look up outgoing cost from squad (playerPool excludes squad members)
  const transferCosts = transfers.map((t) => {
    const outCost = players.find((p) => p.id === t.outId)?.nowCost ?? 0;
    const inCost = t.inPlayer.nowCost;
    return { outCost, inCost, diff: inCost - outCost };
  });
  // netSpend is in 0.1m units (nowCost units); bank is already in millions from fpl.ts
  const netSpend = transferCosts.reduce((acc, c) => acc + c.diff, 0);
  // Also credit the selling price of any pending slots (player removed but not yet replaced)
  const pendingSellingValue = [...pendingSlots].reduce((acc, slotIdx) => {
    const origId = originalPlayerIds[slotIdx];
    return acc + (players.find((p) => p.id === origId)?.nowCost ?? 0);
  }, 0);
  const bankAfter = bank - netSpend / 10 + pendingSellingValue / 10; // both in millions

  const sidebarProps = {
    playerPool,
    squadPlayerIds,
    plannedInIds,
    selectedPositions,
    selectedGwIndex: gwIndex,
    onSelect: applyTransfer,
    onRemovePlanned: handleRemovePlanned,
    currentBank: bankAfter,
  };

  return (
    <>
      {/* Transfer count — above pitch, centered */}
      {transfers.length > 0 && (
        <div className="w-full max-w-2xl mx-auto flex items-center justify-center gap-3 mb-2">
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-black shrink-0"
            style={{ background: "#00ff87", color: "#37003c" }}
          >
            {transfers.length}
          </span>
          <span style={{ color: "rgb(var(--fpl-text))", fontFamily: "var(--font-barlow)", fontWeight: 700, fontSize: "0.9rem" }}>
            transfer{transfers.length !== 1 ? "s" : ""} planned
          </span>
          <button
            onClick={resetPlan}
            className="text-xs font-semibold px-3 py-1 rounded transition"
            style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            Reset
          </button>
        </div>
      )}

      {/*
        Pitch — full-width, max-w-2xl mx-auto, IDENTICAL to PitchView.
        The sidebar is fixed (outside layout flow) so it does NOT shrink this container.
        Pitch centre = W_main / 2, matching Pitch View exactly.
      */}
      <PlanPitchView
        players={effectivePlayers}
        originalPlayerIds={originalPlayerIds}
        plannedInIds={plannedInIds}
        selectedGwIndex={gwIndex}
        pendingSlotIndices={pendingSlots}
        onPlayerClick={handlePlayerClick}
      />

      {/* ── Planned transfers table ── */}
      {transfers.length > 0 && (
        <div
          className="w-full max-w-2xl mx-auto mt-4 rounded-xl overflow-hidden"
          style={{ background: "var(--fpl-bg-surface)", border: "1px solid var(--fpl-border)" }}
        >
          {/* Header */}
          <div
            className="px-4 py-2.5 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--fpl-border)", background: "rgba(0,0,0,0.15)" }}
          >
            <span
              style={{ fontFamily: "var(--font-barlow)", fontWeight: 800, fontSize: "0.85rem", color: "rgb(var(--fpl-text))", letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
              Planned Transfers
            </span>
            <span className="text-xs font-semibold" style={{ color: "var(--fpl-muted)" }}>
              {transfers.length} transfer{transfers.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Table */}
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--fpl-border)", background: "rgba(0,0,0,0.08)" }}>
                {["Player Out", "Sell Price", "Player In", "Buy Price", "Net"].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left font-semibold uppercase tracking-wider"
                    style={{ color: "var(--fpl-muted)", fontSize: "10px" }}
                  >
                    {h}
                  </th>
                ))}
                {/* empty header for cancel column */}
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {transfers.map((t, i) => {
                const outPlayer = players.find((p) => p.id === t.outId);
                const { outCost, inCost, diff } = transferCosts[i];
                const diffStr = diff === 0 ? "±£0.0m" : diff > 0 ? `-£${(diff / 10).toFixed(1)}m` : `+£${(-diff / 10).toFixed(1)}m`;
                const diffColor = diff > 0 ? "#f87171" : diff < 0 ? "var(--fpl-green)" : "var(--fpl-muted)";
                return (
                  <tr
                    key={t.outId}
                    style={{ borderBottom: i < transfers.length - 1 ? "1px solid var(--fpl-border)" : "none" }}
                  >
                    {/* Player Out */}
                    <td className="px-3 py-2.5">
                      <span
                        className="font-bold truncate block max-w-[100px]"
                        style={{ fontFamily: "var(--font-barlow)", fontWeight: 700, color: "#f87171" }}
                      >
                        {outPlayer?.name ?? "Unknown"}
                      </span>
                    </td>
                    {/* Sell Price */}
                    <td className="px-3 py-2.5 tabular-nums" style={{ color: "var(--fpl-muted)" }}>
                      {outCost > 0 ? `£${(outCost / 10).toFixed(1)}m` : "—"}
                    </td>
                    {/* Player In */}
                    <td className="px-3 py-2.5">
                      <span
                        className="font-bold truncate block max-w-[100px]"
                        style={{ fontFamily: "var(--font-barlow)", fontWeight: 700, color: "var(--fpl-green)" }}
                      >
                        {t.inPlayer.name}
                      </span>
                    </td>
                    {/* Buy Price */}
                    <td className="px-3 py-2.5 tabular-nums" style={{ color: "var(--fpl-muted)" }}>
                      £{(inCost / 10).toFixed(1)}m
                    </td>
                    {/* Net */}
                    <td className="px-3 py-2.5 tabular-nums font-bold" style={{ color: diffColor, fontFamily: "var(--font-barlow)" }}>
                      {diffStr}
                    </td>
                    {/* Cancel */}
                    <td className="pr-3 py-2.5 text-right">
                      <button
                        type="button"
                        aria-label={`Cancel transfer: ${outPlayer?.name ?? ""} → ${t.inPlayer.name}`}
                        onClick={() => handleRemovePlanned(t.inPlayer.id)}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.3)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.15)"; }}
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          background: "rgba(239,68,68,0.15)",
                          color: "#f87171",
                          border: "1px solid rgba(239,68,68,0.3)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          fontSize: "13px",
                          lineHeight: 1,
                        }}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid var(--fpl-border)", background: "rgba(0,0,0,0.12)" }}>
                <td
                  colSpan={4}
                  className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--fpl-muted)" }}
                >
                  Total net spend
                </td>
                <td
                  className="px-3 py-2.5 tabular-nums font-black"
                  style={{
                    fontFamily: "var(--font-barlow)",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    color: netSpend > 0 ? "#f87171" : netSpend < 0 ? "var(--fpl-green)" : "var(--fpl-muted)",
                  }}
                >
                  {netSpend === 0 ? "±£0.0m" : netSpend > 0 ? `-£${(netSpend / 10).toFixed(1)}m` : `+£${(-netSpend / 10).toFixed(1)}m`}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ── Desktop: fixed right panel — always open in plan mode ── */}
      <div
        className="hidden lg:flex flex-col"
        style={{
          position: "fixed",
          left: 0,
          top: "var(--nav-height)",
          bottom: 0,
          width: "360px",
          zIndex: 40,
          background: "var(--fpl-bg-surface)",
          borderRight: "1px solid var(--fpl-border)",
          overflow: "hidden",
        }}
      >
        <PlayerSelectionSidebar {...sidebarProps} fillHeight />
      </div>

      {/* ── Mobile: sidebar always shown below pitch in plan mode ── */}
      <div className="lg:hidden mt-6">
        <PlayerSelectionSidebar {...sidebarProps} />
      </div>
    </>
  );
}

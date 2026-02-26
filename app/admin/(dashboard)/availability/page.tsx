"use client";

import { useEffect, useState } from "react";
import { TIME_OPTIONS, DAY_NAMES } from "@/lib/time-slots";

type WeeklyRow = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

type Override = {
  id: string;
  date: string;
  isBlocked: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
};

export default function AvailabilityPage() {
  const [weekly, setWeekly] = useState<WeeklyRow[]>([]);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [overrideDate, setOverrideDate] = useState("");
  const [overrideBlocked, setOverrideBlocked] = useState(true);
  const [overrideStart, setOverrideStart] = useState("09:00");
  const [overrideEnd, setOverrideEnd] = useState("17:00");
  const [overrideReason, setOverrideReason] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/availability").then((r) => r.json()),
      fetch("/api/admin/overrides").then((r) => r.json()),
    ])
      .then(([av, ov]) => {
        if (Array.isArray(av)) {
          if (av.length >= 7) {
            setWeekly(av.sort((a: WeeklyRow, b: WeeklyRow) => a.dayOfWeek - b.dayOfWeek));
          } else {
            setWeekly(
              DAY_NAMES.map((_, i) => av.find((r: WeeklyRow) => r.dayOfWeek === i) ?? { dayOfWeek: i, startTime: "00:00", endTime: "00:00", isActive: false })
            );
          }
        }
        if (Array.isArray(ov)) setOverrides(ov.map((o: { date: string } & Override) => ({ ...o, date: o.date.slice(0, 10) })));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const saveWeekly = async () => {
    const payload =
      weekly.length >= 7
        ? weekly
        : DAY_NAMES.map((_, i) => weekly.find((r) => r.dayOfWeek === i) ?? { dayOfWeek: i, startTime: "00:00", endTime: "00:00", isActive: false });
    setSaving(true);
    try {
      const res = await fetch("/api/admin/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (e) {
      console.error(e);
      alert("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const addOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideDate) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: overrideDate,
          isBlocked: overrideBlocked,
          startTime: overrideBlocked ? undefined : overrideStart,
          endTime: overrideBlocked ? undefined : overrideEnd,
          reason: overrideReason || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const created = await res.json();
      setOverrides((prev) => [...prev, { ...created, date: created.date.slice(0, 10) }]);
      setOverrideDate("");
      setOverrideReason("");
    } catch (err) {
      console.error(err);
      alert("Failed to add override.");
    } finally {
      setSaving(false);
    }
  };

  const deleteOverride = async (id: string) => {
    if (!confirm("Delete this override?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/overrides/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setOverrides((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete.");
    } finally {
      setSaving(false);
    }
  };

  const updateWeekly = (dayOfWeek: number, patch: Partial<WeeklyRow>) => {
    setWeekly((prev) =>
      prev.map((r) => (r.dayOfWeek === dayOfWeek ? { ...r, ...patch } : r))
    );
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Availability</h1>
        <p className="mt-2 text-gray-500">Loading…</p>
      </div>
    );
  }

  const rows =
    weekly.length >= 7
      ? weekly
      : DAY_NAMES.map((_, i) => weekly.find((r) => r.dayOfWeek === i) ?? { dayOfWeek: i, startTime: "00:00", endTime: "00:00", isActive: false });

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-semibold text-gray-900">Availability</h1>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900">Weekly schedule</h2>
        <p className="mt-1 text-sm text-gray-500">Set your regular hours per day. Inactive days are not bookable.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-600">
                <th className="pb-2 pr-4 font-medium">Day</th>
                <th className="pb-2 pr-4 font-medium">Active</th>
                <th className="pb-2 pr-4 font-medium">Start</th>
                <th className="pb-2 pr-4 font-medium">End</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.dayOfWeek} className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium text-gray-900">{DAY_NAMES[r.dayOfWeek]}</td>
                  <td className="py-3 pr-4">
                    <input
                      type="checkbox"
                      checked={r.isActive}
                      onChange={(e) => updateWeekly(r.dayOfWeek, { isActive: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <select
                      value={r.startTime}
                      onChange={(e) => updateWeekly(r.dayOfWeek, { startTime: e.target.value })}
                      className="rounded border border-gray-300 px-2 py-1"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 pr-4">
                    <select
                      value={r.endTime}
                      onChange={(e) => updateWeekly(r.dayOfWeek, { endTime: e.target.value })}
                      className="rounded border border-gray-300 px-2 py-1"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={saveWeekly}
          disabled={saving}
          className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save weekly schedule"}
        </button>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900">Date overrides</h2>
        <p className="mt-1 text-sm text-gray-500">Block specific dates (e.g. vacation) or set custom hours.</p>

        <form onSubmit={addOverride} className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500">Date</label>
            <input
              type="date"
              value={overrideDate}
              onChange={(e) => setOverrideDate(e.target.value)}
              required
              className="mt-1 rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                checked={overrideBlocked}
                onChange={() => setOverrideBlocked(true)}
                className="h-3.5 w-3.5"
              />
              Blocked
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                checked={!overrideBlocked}
                onChange={() => setOverrideBlocked(false)}
                className="h-3.5 w-3.5"
              />
              Custom hours
            </label>
          </div>
          {!overrideBlocked && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500">Start</label>
                <select
                  value={overrideStart}
                  onChange={(e) => setOverrideStart(e.target.value)}
                  className="mt-1 rounded border border-gray-300 px-2 py-1.5 text-sm"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">End</label>
                <select
                  value={overrideEnd}
                  onChange={(e) => setOverrideEnd(e.target.value)}
                  className="mt-1 rounded border border-gray-300 px-2 py-1.5 text-sm"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div className="min-w-[160px]">
            <label className="block text-xs font-medium text-gray-500">Reason (optional)</label>
            <input
              type="text"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Vacation"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            Add override
          </button>
        </form>

        {overrides.length > 0 && (
          <ul className="mt-6 space-y-2">
            {overrides.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
              >
                <span className="font-medium text-gray-900">{o.date}</span>
                <span className="text-gray-600">
                  {o.isBlocked ? "Blocked" : `${o.startTime} – ${o.endTime}`}
                  {o.reason ? ` · ${o.reason}` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => deleteOverride(o.id)}
                  disabled={saving}
                  className="text-red-600 hover:underline disabled:opacity-50"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

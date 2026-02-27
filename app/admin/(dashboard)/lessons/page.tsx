"use client";

import { useEffect, useState } from "react";

type LessonType = {
  id: string;
  duration: number;
  price: number;
  currency: string;
  description: string | null;
  isActive: boolean;
};

export default function LessonsPage() {
  const [items, setItems] = useState<LessonType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/lessons")
      .then((r) => r.json())
      .then((data) => (Array.isArray(data) ? setItems(data) : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const update = (id: string, patch: Partial<LessonType>) => {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/lessons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items.map(({ id, price, currency, description, isActive }) => ({ id, price, currency, description: description ?? null, isActive }))),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
    } catch (e) {
      console.error(e);
      alert("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Lesson types</h1>
        <p className="mt-2 text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-foreground">Lesson types</h1>
      <p className="text-muted-foreground">Set duration, description, price and currency. Inactive types are hidden from the booking page.</p>

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Duration</th>
                <th className="pb-2 pr-4 font-medium">Description</th>
                <th className="pb-2 pr-4 font-medium">Active</th>
                <th className="pb-2 pr-4 font-medium">Price</th>
                <th className="pb-2 pr-4 font-medium">Currency</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-b border-border/50">
                  <td className="py-3 pr-4 font-medium text-foreground">{row.duration} min</td>
                  <td className="py-3 pr-4">
                    <input
                      type="text"
                      value={row.description ?? ""}
                      onChange={(e) => update(row.id, { description: e.target.value || null })}
                      placeholder="Optional"
                      className="w-40 rounded border border-border bg-card px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <input
                      type="checkbox"
                      checked={row.isActive}
                      onChange={(e) => update(row.id, { isActive: e.target.checked })}
                      className="h-4 w-4 rounded border-border"
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={row.price}
                      onChange={(e) => update(row.id, { price: parseFloat(e.target.value) || 0 })}
                      className="w-24 rounded border border-border bg-card px-2 py-1"
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <input
                      type="text"
                      value={row.currency}
                      onChange={(e) => update(row.id, { currency: e.target.value })}
                      placeholder="EUR"
                      className="w-20 rounded border border-border bg-card px-2 py-1 uppercase"
                      maxLength={3}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length === 0 && (
          <p className="mt-4 text-muted-foreground">No lesson types yet. Run the seed: <code className="rounded bg-accent px-1">npm run db:seed</code></p>
        )}
        <button
          type="button"
          onClick={save}
          disabled={saving || items.length === 0}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </section>
    </div>
  );
}

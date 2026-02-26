"use client";

import { useEffect, useState } from "react";

type Settings = {
  bufferMinutes: number;
  minNoticeHours: number;
  maxAdvanceBookingDays: number;
  stripePaymentLink: string;
  postSessionMessage: string;
  googleCalendarId: string | null;
  name: string;
  bio: string;
  photoUrl: string;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        setSettings({
          bufferMinutes: data.bufferMinutes ?? 0,
          minNoticeHours: data.minNoticeHours ?? 24,
          maxAdvanceBookingDays: data.maxAdvanceBookingDays ?? 28,
          stripePaymentLink: data.stripePaymentLink ?? "",
          postSessionMessage: data.postSessionMessage ?? "",
          googleCalendarId: data.googleCalendarId ?? null,
          name: data.name ?? "",
          bio: data.bio ?? "",
          photoUrl: data.photoUrl ?? "",
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const update = (patch: Partial<Settings>) => {
    if (settings) setSettings({ ...settings, ...patch });
  };

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bufferMinutes: settings.bufferMinutes,
          minNoticeHours: settings.minNoticeHours,
          maxAdvanceBookingDays: settings.maxAdvanceBookingDays,
          stripePaymentLink: settings.stripePaymentLink,
          postSessionMessage: settings.postSessionMessage,
          name: settings.name,
          bio: settings.bio,
          photoUrl: settings.photoUrl,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data.error) return;
      setSettings({
        bufferMinutes: data.bufferMinutes ?? 0,
        minNoticeHours: data.minNoticeHours ?? 24,
        maxAdvanceBookingDays: data.maxAdvanceBookingDays ?? 28,
        stripePaymentLink: data.stripePaymentLink ?? "",
        postSessionMessage: data.postSessionMessage ?? "",
        googleCalendarId: data.googleCalendarId ?? null,
        name: data.name ?? "",
        bio: data.bio ?? "",
        photoUrl: data.photoUrl ?? "",
      });
    } catch (e) {
      console.error(e);
      alert("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900">Booking rules</h2>
        <p className="mt-1 text-sm text-gray-500">Control how far in advance clients can book and cancel.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Buffer between bookings (minutes)</label>
            <input
              type="number"
              min={0}
              value={settings.bufferMinutes}
              onChange={(e) => update({ bufferMinutes: parseInt(e.target.value, 10) || 0 })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Minimum notice to book/cancel (hours)</label>
            <input
              type="number"
              min={0}
              value={settings.minNoticeHours}
              onChange={(e) => update({ minNoticeHours: parseInt(e.target.value, 10) || 0 })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max advance booking (days)</label>
            <input
              type="number"
              min={1}
              value={settings.maxAdvanceBookingDays}
              onChange={(e) => update({ maxAdvanceBookingDays: parseInt(e.target.value, 10) || 1 })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900">Payment</h2>
        <p className="mt-1 text-sm text-gray-500">Stripe payment link included in the post-session email.</p>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Stripe payment link URL</label>
          <input
            type="url"
            value={settings.stripePaymentLink}
            onChange={(e) => update({ stripePaymentLink: e.target.value })}
            placeholder="https://buy.stripe.com/..."
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900">Post-session email</h2>
        <p className="mt-1 text-sm text-gray-500">Custom message added to the payment email after a lesson.</p>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Message</label>
          <textarea
            value={settings.postSessionMessage}
            onChange={(e) => update({ postSessionMessage: e.target.value })}
            placeholder="Thanks for the lesson! Here's your payment link..."
            rows={3}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900">Profile (booking page)</h2>
        <p className="mt-1 text-sm text-gray-500">Shown on the public booking page. You can also use env vars.</p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => update({ name: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Photo URL</label>
            <input
              type="url"
              value={settings.photoUrl}
              onChange={(e) => update({ photoUrl: e.target.value })}
              placeholder="https://..."
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              value={settings.bio}
              onChange={(e) => update({ bio: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900">Google Calendar</h2>
        <p className="mt-1 text-sm text-gray-500">Connect a calendar to block busy times and create events with Meet links.</p>
        <div className="mt-4 flex items-center gap-4">
          {settings.googleCalendarId ? (
            <p className="text-sm text-gray-600">
              Connected: <span className="font-medium">{settings.googleCalendarId}</span>
            </p>
          ) : (
            <p className="text-sm text-amber-600">Not connected</p>
          )}
          <a
            href="/admin/calendar"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            {settings.googleCalendarId ? "Re-authorize" : "Connect calendar"}
          </a>
        </div>
      </section>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="rounded-lg bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
    </div>
  );
}

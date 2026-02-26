"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function CalendarContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<{
    connected: boolean;
    calendarId: string | null;
    freebusyOk: boolean | null;
    freebusyError: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/calendar/status")
      .then((r) => r.json())
      .then((data) => setStatus(data))
      .catch(() => setStatus({ connected: false, calendarId: null, freebusyOk: null, freebusyError: null }))
      .finally(() => setLoading(false));
  }, []);

  const connected = searchParams.get("connected") === "1";
  const error = searchParams.get("error");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">Google Calendar</h1>
      <p className="text-gray-600">
        Connect your calendar to create events with Meet links when clients book, and to block busy times.
      </p>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {error === "access_denied" && "You denied access. You can try again below."}
          {error === "missing_code" && "Authorization was cancelled or invalid."}
          {error === "invalid_state" && "Invalid session. Please try again."}
          {!["access_denied", "missing_code", "invalid_state"].includes(error) && `Error: ${error}`}
        </div>
      )}

      {connected && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Calendar connected successfully.
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : status?.connected ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="font-medium text-gray-900">Connected</p>
          <p className="mt-1 text-sm text-gray-600">
            Calendar: {status.calendarId ?? "primary"}
          </p>
          {status.freebusyOk === true && (
            <p className="mt-2 text-sm text-green-700">
              Busy times are read correctly — slots blocked on your calendar will be hidden from clients.
            </p>
          )}
          {status.freebusyOk === false && (
            <div className="mt-2 rounded border border-amber-200 bg-amber-50 p-2 text-sm text-amber-800">
              <strong>Busy times not available.</strong> Your calendar is connected but the app could not read busy slots, so clients may see times you are already busy.
              {status.freebusyError && (
                <p className="mt-1 font-mono text-xs">{status.freebusyError}</p>
              )}
            </div>
          )}
          <a
            href="/api/admin/calendar/connect"
            className="mt-4 inline-block rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Re-authorize
          </a>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-gray-600">Not connected. Click below to connect with Google (Calendar scope).</p>
          <a
            href="/api/admin/calendar/connect"
            className="mt-4 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Connect Google Calendar
          </a>
        </div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<p className="text-gray-500">Loading…</p>}>
      <CalendarContent />
    </Suspense>
  );
}

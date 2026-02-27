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
      <h1 className="text-2xl font-semibold text-foreground">Google Calendar</h1>
      <p className="text-muted-foreground">
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
        <p className="text-muted-foreground">Loading…</p>
      ) : status?.connected ? (
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="font-medium text-foreground">Connected</p>
          <p className="mt-1 text-sm text-muted-foreground">
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
            className="mt-4 inline-block rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Re-authorize
          </a>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-muted-foreground">Not connected. Click below to connect with Google (Calendar scope).</p>
          <a
            href="/api/admin/calendar/connect"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
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
    <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
      <CalendarContent />
    </Suspense>
  );
}

"use client";

import { useEffect, useState } from "react";

type Booking = {
  id: string;
  clientName: string;
  clientEmail: string;
  clientTimezone: string;
  startTime: string;
  endTime: string;
  status: string;
  duration: number;
  price: number;
  currency: string;
  managementToken: string;
  meetLink: string | null;
  cancelledAt: string | null;
};

function formatInTz(isoUtc: string, tz: string): string {
  try {
    const d = new Date(isoUtc);
    return d.toLocaleString(undefined, {
      timeZone: tz,
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return new Date(isoUtc).toLocaleString();
  }
}

function formatDateOnly(isoUtc: string, tz: string): string {
  try {
    const d = new Date(isoUtc);
    return d.toLocaleDateString(undefined, { timeZone: tz, weekday: "short", month: "short", day: "numeric" });
  } catch {
    return new Date(isoUtc).toLocaleDateString();
  }
}

function formatTimeOnly(isoUtc: string, tz: string): string {
  try {
    const d = new Date(isoUtc);
    return d.toLocaleTimeString(undefined, { timeZone: tz, hour: "2-digit", minute: "2-digit" });
  } catch {
    return new Date(isoUtc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
}

function statusBadge(status: string): string {
  switch (status) {
    case "CONFIRMED":
      return "bg-green-100 text-green-800";
    case "CANCELLED":
      return "bg-red-100 text-red-800";
    case "COMPLETED":
      return "bg-gray-100 text-gray-800";
    case "RESCHEDULED":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [teacherTimezone, setTeacherTimezone] = useState("Europe/Paris");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchBookings = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    fetch(`/api/admin/bookings?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.bookings) {
          setBookings(data.bookings);
          if (data.teacherTimezone) setTeacherTimezone(data.teacherTimezone);
        } else setBookings([]);
      })
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, fromDate, toDate]);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Bookings</h1>

      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-4">
        <div>
          <label htmlFor="status" className="mr-2 text-sm text-muted-foreground">Status</label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border border-border bg-card px-2 py-1.5 text-sm text-foreground"
          >
            <option value="">All</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
            <option value="RESCHEDULED">Rescheduled</option>
          </select>
        </div>
        <div>
          <label htmlFor="from" className="mr-2 text-sm text-muted-foreground">From</label>
          <input
            id="from"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded border border-border bg-card px-2 py-1.5 text-sm text-foreground"
          />
        </div>
        <div>
          <label htmlFor="to" className="mr-2 text-sm text-muted-foreground">To</label>
          <input
            id="to"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded border border-border bg-card px-2 py-1.5 text-sm text-foreground"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setFromDate("");
            setToDate("");
            setStatusFilter("");
          }}
          className="text-sm text-muted-foreground underline hover:text-foreground"
        >
          Reset filters
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : bookings.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-6 text-muted-foreground">No bookings match the current filters.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-accent">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-accent/50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">
                      {formatDateOnly(b.startTime, teacherTimezone)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {formatTimeOnly(b.startTime, teacherTimezone)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-foreground">{b.clientName}</div>
                      <div className="text-muted-foreground">{b.clientEmail}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {b.duration} min
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(b.status)}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <a
                        href={`${appUrl}/manage/${b.managementToken}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground underline hover:text-foreground"
                      >
                        View
                      </a>
                      {b.meetLink && (
                        <>
                          {" · "}
                          <a
                            href={b.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground underline hover:text-foreground"
                          >
                            Meet
                          </a>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Times shown in your timezone ({teacherTimezone}). Default range: 30 days ago to 90 days ahead.
      </p>
    </div>
  );
}

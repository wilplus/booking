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
      <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>

      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label htmlFor="status" className="mr-2 text-sm text-gray-600">Status</label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="">All</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
            <option value="RESCHEDULED">Rescheduled</option>
          </select>
        </div>
        <div>
          <label htmlFor="from" className="mr-2 text-sm text-gray-600">From</label>
          <input
            id="from"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label htmlFor="to" className="mr-2 text-sm text-gray-600">To</label>
          <input
            id="to"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setFromDate("");
            setToDate("");
            setStatusFilter("");
          }}
          className="text-sm text-gray-600 underline hover:text-gray-900"
        >
          Reset filters
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : bookings.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-6 text-gray-600">No bookings match the current filters.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                      {formatDateOnly(b.startTime, teacherTimezone)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {formatTimeOnly(b.startTime, teacherTimezone)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">{b.clientName}</div>
                      <div className="text-gray-500">{b.clientEmail}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
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
                        className="text-gray-600 underline hover:text-gray-900"
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
                            className="text-gray-600 underline hover:text-gray-900"
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

      <p className="text-sm text-gray-500">
        Times shown in your timezone ({teacherTimezone}). Default range: 30 days ago to 90 days ahead.
      </p>
    </div>
  );
}

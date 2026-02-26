"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

type Booking = {
  id: string;
  managementToken: string;
  clientName: string;
  clientEmail: string;
  clientTimezone: string;
  startTime: string;
  endTime: string;
  status: string;
  meetLink: string | null;
  duration: number;
  price: number;
  currency: string;
  teacherName: string;
};

function formatInTz(isoUtc: string, tz: string): string {
  try {
    const d = new Date(isoUtc);
    return d.toLocaleString(undefined, {
      timeZone: tz,
      dateStyle: "full",
      timeStyle: "short",
    });
  } catch {
    return new Date(isoUtc).toLocaleString();
  }
}

export default function ManageBookingPage() {
  const params = useParams();
  const token = params?.token as string;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/bookings/${encodeURIComponent(token)}`)
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => (data?.error ? null : setBooking(data)))
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
  }, [token]);

  const handleCancel = async () => {
    if (!token || !confirm("Are you sure you want to cancel this booking?")) return;
    setCancelError("");
    setCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(token)}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setCancelError(data.error ?? "Failed to cancel");
        return;
      }
      setCancelled(true);
      setBooking((prev) => (prev ? { ...prev, status: "CANCELLED" } : null));
    } catch {
      setCancelError("Something went wrong. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-lg pt-12 text-center text-gray-500">Loading…</div>
      </main>
    );
  }
  if (!booking) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-lg rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-xl font-semibold text-gray-900">Booking not found</h1>
          <p className="mt-2 text-gray-600">This link may be invalid or the booking was removed.</p>
          <a href="/" className="mt-4 inline-block text-gray-900 underline">Back to booking</a>
        </div>
      </main>
    );
  }

  const tz = booking.clientTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isPast = new Date(booking.startTime) < new Date();
  const canCancel = booking.status === "CONFIRMED" && !isPast;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-lg">
        <Logo className="mb-6" />
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">Your booking</h1>
        <p className="mt-1 text-gray-600">with {booking.teacherName}</p>

        <dl className="mt-6 space-y-2 text-sm">
          <div>
            <dt className="text-gray-500">When</dt>
            <dd className="font-medium text-gray-900">{formatInTz(booking.startTime, tz)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Duration</dt>
            <dd className="font-medium text-gray-900">{booking.duration} minutes</dd>
          </div>
          {booking.meetLink && (
            <div>
              <dt className="text-gray-500">Meet link</dt>
              <dd>
                <a
                  href={booking.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 underline"
                >
                  Join video call
                </a>
              </dd>
            </div>
          )}
        </dl>

        {booking.status === "CANCELLED" || cancelled ? (
          <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            This booking has been cancelled.
          </p>
        ) : canCancel ? (
          <div className="mt-6">
            {cancelError && (
              <p className="mb-3 text-sm text-red-600">{cancelError}</p>
            )}
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {cancelling ? "Cancelling…" : "Cancel booking"}
            </button>
          </div>
        ) : booking.status === "CONFIRMED" && isPast ? (
          <p className="mt-6 text-sm text-gray-500">This lesson has already passed.</p>
        ) : null}

        <a href="/" className="mt-6 inline-block text-sm text-gray-600 underline">
          Book another lesson
        </a>
        </div>
      </div>
    </main>
  );
}

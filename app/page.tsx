"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

type LessonType = { id: string; duration: number; price: number; currency: string };
type Teacher = { id: string; name: string; photoUrl: string | null; bio: string | null; lessonTypes: LessonType[] };

function formatInTz(isoUtc: string, tz: string): string {
  try {
    const d = new Date(isoUtc);
    return d.toLocaleTimeString(undefined, { timeZone: tz, hour: "2-digit", minute: "2-digit" });
  } catch {
    return new Date(isoUtc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
}

function formatDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function Home() {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"duration" | "date" | "time" | "form" | "done">("duration");
  const [selectedDuration, setSelectedDuration] = useState<LessonType | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientTz, setClientTz] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmResult, setConfirmResult] = useState<{ managementToken: string } | null>(null);

  useEffect(() => {
    setClientTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  useEffect(() => {
    fetch("/api/teacher")
      .then((r) => r.json())
      .then((data) => {
        if (data.id) setTeacher(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedDate || !selectedDuration) return;
    setSlotsLoading(true);
    setSlots([]);
    setSelectedSlot(null);
    fetch(`/api/availability?date=${selectedDate}&duration=${selectedDuration.duration}`)
      .then((r) => r.json())
      .then((data) => setSlots(data.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, selectedDuration]);

  const dateOptions: string[] = [];
  const today = new Date();
  for (let i = 0; i < 28; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dateOptions.push(formatDateKey(d));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDuration || !selectedSlot || !clientName.trim() || !clientEmail.trim()) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim(),
          clientTimezone: clientTz,
          lessonTypeId: selectedDuration.id,
          startTime: selectedSlot,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Booking failed");
        return;
      }
      setConfirmResult({ managementToken: data.managementToken });
      setStep("done");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-lg pt-12 text-center text-gray-500">Loading…</div>
      </main>
    );
  }
  if (!teacher) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-lg pt-12 text-center text-gray-600">No booking available at the moment.</div>
      </main>
    );
  }

  if (step === "done" && confirmResult) {
    const manageUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/manage/${confirmResult.managementToken}`;
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-lg">
          <Logo className="mb-6" />
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-semibold text-gray-900">Booking confirmed</h1>
          <p className="mt-2 text-gray-600">
            Check your email for the meeting link and calendar invite. You can cancel or reschedule using the link below.
          </p>
          <a
            href={manageUrl}
            className="mt-4 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Manage booking
          </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-lg">
        <Logo className="mb-6" />
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {teacher.photoUrl && (
            <img
              src={teacher.photoUrl}
              alt={teacher.name}
              className="mx-auto h-20 w-20 rounded-full object-cover"
            />
          )}
          <h1 className="mt-4 text-center text-xl font-semibold text-gray-900">{teacher.name}</h1>
          {teacher.bio && <p className="mt-2 text-center text-sm text-gray-600">{teacher.bio}</p>}
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {step === "duration" && (
            <>
              <h2 className="font-medium text-gray-900">Choose duration</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {teacher.lessonTypes.map((lt) => (
                  <button
                    key={lt.id}
                    type="button"
                    onClick={() => { setSelectedDuration(lt); setStep("date"); }}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-left shadow-sm hover:border-gray-400"
                  >
                    <span className="font-medium">{lt.duration} min</span>
                    <span className="ml-2 text-gray-600">
                      {lt.currency} {lt.price}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === "date" && selectedDuration && (
            <>
              <button
                type="button"
                onClick={() => { setSelectedDuration(null); setStep("duration"); }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Change duration
              </button>
              <h2 className="mt-4 font-medium text-gray-900">Choose date</h2>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {dateOptions.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => { setSelectedDate(d); setStep("time"); }}
                    className="rounded-lg border border-gray-300 py-2 text-sm hover:border-gray-400"
                  >
                    {new Date(d + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === "time" && selectedDuration && selectedDate && (
            <>
              <button
                type="button"
                onClick={() => { setSelectedDate(null); setStep("date"); }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Change date
              </button>
              <h2 className="mt-4 font-medium text-gray-900">Choose time</h2>
              {slotsLoading ? (
                <p className="mt-3 text-sm text-gray-500">Loading slots…</p>
              ) : slots.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">No slots available this day.</p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {slots.map((iso) => (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => { setSelectedSlot(iso); setStep("form"); }}
                      className={`rounded-lg border px-3 py-2 text-sm ${selectedSlot === iso ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 hover:border-gray-400"}`}
                    >
                      {formatInTz(iso, clientTz)}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {step === "form" && selectedDuration && selectedSlot && (
            <form onSubmit={handleSubmit}>
              <button
                type="button"
                onClick={() => setStep("time")}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Change time
              </button>
              <p className="mt-2 text-sm text-gray-600">
                {selectedDate} at {formatInTz(selectedSlot, clientTz)} · {selectedDuration.duration} min
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    required
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full rounded-lg bg-gray-900 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {submitting ? "Booking…" : "Confirm booking"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

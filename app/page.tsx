"use client";

import { useEffect, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Clock, Video, Globe } from "lucide-react";
import { Logo } from "@/components/Logo";

type LessonType = {
  id: string;
  duration: number;
  price: number;
  currency: string;
  description?: string | null;
};
type Teacher = {
  id: string;
  name: string;
  photoUrl: string | null;
  bio: string | null;
  teacherTimezone: string;
  lessonTypes: LessonType[];
};

function formatTimeInTz(isoUtc: string, tz: string, hour12: boolean): string {
  try {
    const d = new Date(isoUtc);
    return d.toLocaleTimeString(undefined, {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12,
    });
  } catch {
    return new Date(isoUtc).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12,
    });
  }
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthGrid(year: number, month: number): (string | null)[][] {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const startWeekday = first.getDay();
  const daysInMonth = last.getDate();
  const rows: (string | null)[][] = [];
  let row: (string | null)[] = [];
  for (let i = 0; i < startWeekday; i++) row.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    row.push(dateStr);
    if (row.length === 7) {
      rows.push(row);
      row = [];
    }
  }
  if (row.length > 0) {
    while (row.length < 7) row.push(null);
    rows.push(row);
  }
  return rows;
}

export default function Home() {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState<LessonType | null>(null);
  const [displayMonth, setDisplayMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [dateOptions, setDateOptions] = useState<string[]>([]);
  const [datesWithSlots, setDatesWithSlots] = useState<string[]>([]);
  const [datesLoading, setDatesLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [hour12, setHour12] = useState(true);
  const [step, setStep] = useState<"pick" | "form" | "done">("pick");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientTz, setClientTz] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmResult, setConfirmResult] = useState<{ managementToken: string; emailSent?: boolean } | null>(null);

  useEffect(() => {
    setClientTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  useEffect(() => {
    fetch("/api/teacher")
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          setTeacher(data);
          if (data.lessonTypes?.length === 1) {
            setSelectedDuration(data.lessonTypes[0]);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedDuration) return;
    setDatesLoading(true);
    setDateOptions([]);
    setDatesWithSlots([]);
    setSelectedDate(null);
    setSelectedSlot(null);
    fetch(
      `/api/availability/dates?duration=${selectedDuration.duration}&year=${displayMonth.year}&month=${displayMonth.month}`
    )
      .then((r) => r.json())
      .then((data) => {
        setDateOptions(data.dates ?? []);
        setDatesWithSlots(data.datesWithSlots ?? []);
      })
      .catch(() => {
        setDateOptions([]);
        setDatesWithSlots([]);
      })
      .finally(() => setDatesLoading(false));
  }, [selectedDuration, displayMonth.year, displayMonth.month]);

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

  const monthGrid = useMemo(
    () => getMonthGrid(displayMonth.year, displayMonth.month),
    [displayMonth.year, displayMonth.month]
  );
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }, []);

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
      setConfirmResult({ managementToken: data.managementToken, emailSent: data.emailSent });
      setStep("done");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-[50rem] pt-12 text-center text-muted-foreground">Loading…</div>
      </main>
    );
  }
  if (!teacher) {
    return (
      <main className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-[50rem] pt-12 text-center text-muted-foreground">
          No booking available at the moment.
        </div>
      </main>
    );
  }

  if (step === "done" && confirmResult) {
    const manageUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/manage/${confirmResult.managementToken}`;
    const emailSent = confirmResult.emailSent !== false;
    return (
      <main className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-[50rem]">
          <Logo className="mb-6" />
          <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
            <h1 className="text-xl font-semibold text-foreground">Booking confirmed</h1>
            {emailSent ? (
              <p className="mt-2 text-muted-foreground">
                Check your email for the meeting link and calendar invite. You can cancel or reschedule using the link
                below.
              </p>
            ) : (
              <p className="mt-2 text-muted-foreground">
                We couldn&apos;t send the confirmation email. Please use the link below to manage your booking and save
                it for your records.
              </p>
            )}
            <a
              href={manageUrl}
              className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Manage booking
            </a>
          </div>
        </div>
      </main>
    );
  }

  if (step === "form" && selectedDuration && selectedSlot && selectedDate) {
    return (
      <main className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-[50rem]">
          <Logo className="mb-6" />
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <button
              type="button"
              onClick={() => setStep("pick")}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to calendar
            </button>
            <p className="mt-2 text-sm text-muted-foreground">
              {selectedDate} at {formatTimeInTz(selectedSlot, clientTz, hour12)} · {selectedDuration.duration} min
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground">Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Email</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-primary py-3 font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Booking…" : "Confirm booking"}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  const teacherTz = teacher.teacherTimezone ?? "Europe/Paris";

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-[50rem]">
        <Logo className="mb-6" />
        <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm sm:flex-row">
          {/* Panel 1 — Booking info */}
          <div className="w-full shrink-0 border-b border-border p-4 sm:w-[180px] sm:border-b-0 sm:border-r sm:border-border">
            <div className="flex items-center gap-3">
              {teacher.photoUrl ? (
                <img
                  src={teacher.photoUrl}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-medium text-foreground">
                  {teacher.name.charAt(0)}
                </div>
              )}
              <span className="text-xs text-muted-foreground">{teacher.name}</span>
            </div>
            {!selectedDuration ? (
              <div className="mt-4">
                <p className="text-xs font-medium text-muted-foreground">Choose lesson</p>
                <div className="mt-2 space-y-1.5">
                  {teacher.lessonTypes.map((lt) => (
                    <button
                      key={lt.id}
                      type="button"
                      onClick={() => setSelectedDuration(lt)}
                      className="block w-full rounded-lg border border-border bg-card px-3 py-2 text-left text-sm hover:border-primary/40 hover:bg-accent"
                    >
                      <span className="font-medium text-foreground">{lt.duration} min</span>
                      <span className="ml-1 text-muted-foreground">
                        {lt.currency} {lt.price}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDuration(null);
                    setSelectedDate(null);
                    setSelectedSlot(null);
                  }}
                  className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Change lesson
                </button>
                <h2 className="mt-2 text-base font-bold text-foreground">
                  {selectedDuration.duration} min lesson
                </h2>
                {selectedDuration.description && (
                  <p className="mt-1 text-xs text-muted-foreground">{selectedDuration.description}</p>
                )}
                <dl className="mt-3 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span className="rounded border border-border px-1.5 py-0.5 text-[11px] font-medium">
                      {selectedDuration.duration} min
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="h-3.5 w-3.5 shrink-0" />
                    <span>Google Meet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 shrink-0" />
                    <span>Times in your timezone</span>
                  </div>
                </dl>
              </>
            )}
          </div>

          {/* Panel 2 — Calendar */}
          <div className="flex-1 p-4">
            {!selectedDuration ? (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                Choose a lesson to see availability
              </div>
            ) : (
              <>
                <div className="flex items-center justify-end gap-1">
                  <span className="text-sm font-semibold text-foreground">
                    {new Date(displayMonth.year, displayMonth.month - 1).toLocaleString("default", {
                      month: "long",
                    })}{" "}
                    <span className="font-normal text-muted-foreground">{displayMonth.year}</span>
                  </span>
                  <div className="flex gap-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        setDisplayMonth((prev) =>
                          prev.month === 1
                            ? { year: prev.year - 1, month: 12 }
                            : { year: prev.year, month: prev.month - 1 }
                        )
                      }
                      className="rounded-md p-1.5 hover:bg-accent"
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDisplayMonth((prev) =>
                          prev.month === 12
                            ? { year: prev.year + 1, month: 1 }
                            : { year: prev.year, month: prev.month + 1 }
                        )
                      }
                      className="rounded-md p-1.5 hover:bg-accent"
                      aria-label="Next month"
                    >
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-7 gap-0.5">
                  {DAY_LABELS.map((label) => (
                    <div
                      key={label}
                      className="py-1 text-center text-[10px] font-medium text-muted-foreground"
                    >
                      {label}
                    </div>
                  ))}
                  {datesLoading ? (
                    <div className="col-span-7 py-8 text-center text-sm text-muted-foreground">
                      Loading…
                    </div>
                  ) : (
                    monthGrid.flatMap((row, rowIndex) =>
                      row.map((dateStr, colIndex) => {
                        if (!dateStr) {
                          return (
                            <div key={`e-${rowIndex}-${colIndex}`} className="aspect-square" />
                          );
                        }
                        const hasSlots = datesWithSlots.includes(dateStr);
                        const isInRange = dateOptions.includes(dateStr);
                        const isSelected = selectedDate === dateStr;
                        const isToday = dateStr === todayStr;
                        const isPast = dateStr < todayStr;
                        const isDisabled = isPast || !hasSlots;
                        const isAvailable = isInRange && hasSlots;
                        return (
                          <button
                            key={dateStr}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => (hasSlots ? setSelectedDate(dateStr) : undefined)}
                            className={`aspect-square rounded-md text-xs transition-colors ${
                              isDisabled
                                ? "cursor-default bg-transparent text-muted-foreground/40"
                                : isSelected
                                  ? "bg-primary font-semibold text-white"
                                  : isToday
                                    ? "bg-accent font-medium text-foreground ring-1 ring-primary/30"
                                    : "bg-accent font-medium text-foreground hover:bg-accent/80"
                            }`}
                          >
                            {new Date(dateStr + "T12:00:00").getDate()}
                          </button>
                        );
                      })
                    )
                  )}
                </div>
              </>
            )}
          </div>

          {/* Panel 3 — Time slots */}
          <div className="w-full shrink-0 border-t border-border p-4 sm:w-[160px] sm:border-t-0 sm:border-l sm:border-border">
            {!selectedDate ? (
              <p className="text-xs text-muted-foreground">Select a date</p>
            ) : (
              <>
                <p className="text-sm font-semibold text-foreground">
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString(undefined, {
                    weekday: "short",
                    day: "numeric",
                  })}
                </p>
                <div className="mt-2 flex rounded-lg border border-border p-0.5">
                  <button
                    type="button"
                    onClick={() => setHour12(true)}
                    className={`flex-1 rounded-md px-2 py-1 text-[10px] ${hour12 ? "bg-primary text-white" : "text-muted-foreground hover:bg-accent"}`}
                  >
                    12h
                  </button>
                  <button
                    type="button"
                    onClick={() => setHour12(false)}
                    className={`flex-1 rounded-md px-2 py-1 text-[10px] ${!hour12 ? "bg-primary text-white" : "text-muted-foreground hover:bg-accent"}`}
                  >
                    24h
                  </button>
                </div>
                <div className="mt-3 max-h-[280px] overflow-y-auto space-y-1.5">
                  {slotsLoading ? (
                    <p className="text-xs text-muted-foreground">Loading…</p>
                  ) : slots.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No slots this day</p>
                  ) : (
                    slots.map((iso) => (
                      <button
                        key={iso}
                        type="button"
                        onClick={() => setSelectedSlot(iso)}
                        className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                          selectedSlot === iso
                            ? "border-primary bg-primary/5 font-medium text-foreground"
                            : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-available" aria-hidden />
                        {formatTimeInTz(iso, clientTz, hour12)}
                      </button>
                    ))
                  )}
                </div>
                {selectedSlot && (
                  <button
                    type="button"
                    onClick={() => setStep("form")}
                    className="mt-4 w-full rounded-lg bg-primary py-2 text-sm font-medium text-white hover:opacity-90"
                  >
                    Continue
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

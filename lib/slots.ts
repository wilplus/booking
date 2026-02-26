import { addMinutes, addDays, parseISO, format } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export type WeeklySlotInput = {
  startTime: string;
  endTime: string;
  isActive: boolean;
} | null;

export type DateOverrideInput = {
  isBlocked: boolean;
  startTime: string | null;
  endTime: string | null;
} | null;

export type SlotRange = { start: Date; end: Date };

export type GetAvailableSlotsParams = {
  /** Date string YYYY-MM-DD (the day in teacher's timezone) */
  dateStr: string;
  /** Lesson duration in minutes */
  durationMinutes: number;
  /** Buffer between bookings in minutes */
  bufferMinutes: number;
  /** Slot start must be at least this many hours from now */
  minNoticeHours: number;
  /** Slot date must be within this many days from today (teacher tz) */
  maxAdvanceBookingDays: number;
  /** Teacher's IANA timezone (e.g. Europe/Paris) */
  teacherTimezone: string;
  /** Weekly availability for this day of week (0-6). If null or !isActive, no slots. */
  weeklySlot: WeeklySlotInput;
  /** Override for this date. If isBlocked, no slots. If custom hours, use startTime/endTime. */
  dateOverride: DateOverrideInput;
  /** Existing confirmed bookings (UTC). Block [start-buffer, end+buffer]. */
  existingBookings: SlotRange[];
  /** Google Calendar busy slots (UTC). Block exactly. */
  busySlots: SlotRange[];
  /** Step between candidate slot starts in minutes (default 15) */
  slotStepMinutes?: number;
};

/**
 * Returns UTC Date instances for each available slot start.
 * All inputs (availability, overrides) use teacher's local time for the given date;
 * bookings and busySlots are in UTC.
 */
export function getAvailableSlots(params: GetAvailableSlotsParams): Date[] {
  const {
    dateStr,
    durationMinutes,
    bufferMinutes,
    minNoticeHours,
    maxAdvanceBookingDays,
    teacherTimezone,
    weeklySlot,
    dateOverride,
    existingBookings,
    busySlots,
    slotStepMinutes = 15,
  } = params;

  if (!weeklySlot?.isActive) return [];
  if (dateOverride?.isBlocked) return [];

  const now = new Date();
  const todayInTeacherTz = format(toZonedTime(now, teacherTimezone), "yyyy-MM-dd");
  const maxAllowedDate = addDays(parseISO(todayInTeacherTz), maxAdvanceBookingDays);
  if (dateStr < todayInTeacherTz || dateStr > format(maxAllowedDate, "yyyy-MM-dd")) {
    return [];
  }

  const [startTime, endTime] = (() => {
    if (dateOverride && !dateOverride.isBlocked && dateOverride.startTime && dateOverride.endTime) {
      return [dateOverride.startTime, dateOverride.endTime];
    }
    return [weeklySlot.startTime, weeklySlot.endTime];
  })();

  const windowStart = fromZonedTime(
    `${dateStr}T${startTime}:00`,
    teacherTimezone
  );
  const windowEnd = fromZonedTime(
    `${dateStr}T${endTime}:00`,
    teacherTimezone
  );

  if (windowStart.getTime() >= windowEnd.getTime()) return [];

  const minStart = addMinutes(now, minNoticeHours * 60);

  const blockedRanges: SlotRange[] = [
    ...existingBookings.map((b) => ({
      start: addMinutes(b.start, -bufferMinutes),
      end: addMinutes(b.end, bufferMinutes),
    })),
    ...busySlots,
  ];

  const slots: Date[] = [];
  let slotStart = new Date(windowStart.getTime());

  while (slotStart.getTime() + durationMinutes * 60 * 1000 <= windowEnd.getTime()) {
    const slotEnd = addMinutes(slotStart, durationMinutes);

    if (slotStart.getTime() < minStart.getTime()) {
      slotStart = addMinutes(slotStart, slotStepMinutes);
      continue;
    }

    const overlaps = blockedRanges.some(
      (r) =>
        (slotStart.getTime() < r.end.getTime() && slotEnd.getTime() > r.start.getTime())
    );
    if (overlaps) {
      slotStart = addMinutes(slotStart, slotStepMinutes);
      continue;
    }

    slots.push(new Date(slotStart));
    slotStart = addMinutes(slotStart, slotStepMinutes);
  }

  return slots;
}

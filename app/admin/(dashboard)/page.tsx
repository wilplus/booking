import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
      <p className="mt-1 text-muted-foreground">
        Today&apos;s upcoming bookings, this week, and quick stats will go here.
      </p>
      <nav className="mt-8 flex flex-wrap gap-4">
        <Link
          href="/admin/availability"
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent"
        >
          Availability
        </Link>
        <Link
          href="/admin/lessons"
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent"
        >
          Lesson types
        </Link>
        <Link
          href="/admin/settings"
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent"
        >
          Settings
        </Link>
        <Link
          href="/admin/bookings"
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent"
        >
          Bookings
        </Link>
        <Link
          href="/admin/calendar"
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent"
        >
          Calendar
        </Link>
      </nav>
    </div>
  );
}

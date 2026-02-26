import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-gray-600">
        Today&apos;s upcoming bookings, this week, and quick stats will go here.
      </p>
      <nav className="mt-8 flex flex-wrap gap-4">
        <Link
          href="/admin/availability"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Availability
        </Link>
        <Link
          href="/admin/lessons"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Lesson types
        </Link>
        <Link
          href="/admin/settings"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Settings
        </Link>
        <Link
          href="/admin/bookings"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Bookings
        </Link>
        <Link
          href="/admin/calendar"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Calendar
        </Link>
      </nav>
    </div>
  );
}

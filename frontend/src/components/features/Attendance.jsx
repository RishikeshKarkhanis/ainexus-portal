import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Download, Search, Users, ClipboardCheck, LoaderCircle, AlertCircle, RefreshCw, FileSpreadsheet } from "lucide-react";

import { adminApiRequest } from "../../lib/api";

const COLUMNS = [
  { key: "name", label: "Name" },
  { key: "enrollmentNumber", label: "Enrollment Number" },
  { key: "userId", label: "User ID" },
  { key: "teamName", label: "Team Name" },
  { key: "teamId", label: "Team ID" },
  { key: "eventName", label: "Event Name" },
  { key: "eventId", label: "Event ID" },
  { key: "timestamp", label: "Timestamp" },
];

const getValue = (record, camelCase, snakeCase) => record?.[camelCase] ?? record?.[snakeCase] ?? "";

const normalizeRecord = (record) => ({
  name: getValue(record, "name", "name"),
  enrollmentNumber: getValue(record, "enrollmentNumber", "enrollment_number"),
  userId: getValue(record, "userId", "user_id"),
  teamName: getValue(record, "teamName", "team_name"),
  teamId: getValue(record, "teamId", "team_id"),
  eventName: getValue(record, "eventName", "event_name"),
  eventId: getValue(record, "eventId", "event_id"),
  timestamp: getValue(record, "timestamp", "checked_in_at"),
});

const formatTimestamp = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

const escapeCsvValue = (value) => {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

function Attendance() {
  const [events, setEvents] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAttendanceData = async () => {
    setLoading(true);
    setError("");

    try {
      const [eventData, attendanceData] = await Promise.all([adminApiRequest("/api/events"), adminApiRequest("/api/admin/attendance")]);

      setEvents(Array.isArray(eventData) ? eventData : []);
      setRecords(Array.isArray(attendanceData) ? attendanceData.map(normalizeRecord) : []);
    } catch (err) {
      setError(err.message || "Unable to fetch attendance records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return records.filter((record) => {
      const matchesEvent = selectedEventId === "all" || String(record.eventId) === String(selectedEventId);

      const searchableText = [record.name, record.enrollmentNumber, record.teamName].join(" ").toLowerCase();

      return matchesEvent && (!query || searchableText.includes(query));
    });
  }, [records, selectedEventId, searchTerm]);

  const selectedEvent = selectedEventId === "all" ? null : events.find((event) => String(event.eventId) === String(selectedEventId));

  const handleExportCsv = () => {
    if (filteredRecords.length === 0) return;

    const rows = [COLUMNS.map((column) => escapeCsvValue(column.label)).join(","), ...filteredRecords.map((record) => COLUMNS.map((column) => escapeCsvValue(record[column.key])).join(","))];

    const csvContent = `\uFEFF${rows.join("\r\n")}`;
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const eventSlug = selectedEvent?.eventName
      ? selectedEvent.eventName
          .trim()
          .replace(/[^a-z0-9]+/gi, "-")
          .replace(/^-|-$/g, "")
      : "all-events";

    link.href = downloadUrl;
    link.download = `attendance-${eventSlug || "event"}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);
  };

  const handleEventChange = (event) => {
    setSelectedEventId(event.target.value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck size={23} className="text-blue-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Attendance Records</h2>
          </div>
          <p className="mt-1 text-sm text-gray-500">View participant check-ins across events and export attendance data.</p>
        </div>

        <button type="button" onClick={handleExportCsv} disabled={loading || filteredRecords.length === 0} className="flex w-fit items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">
          <Download size={17} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="attendance-event" className="mb-2 block text-sm font-medium text-gray-700">
              Filter by event
            </label>
            <div className="relative">
              <CalendarDays size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select id="attendance-event" value={selectedEventId} onChange={handleEventChange} className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-gray-500" disabled={loading}>
                <option value="all">All Events</option>
                {events.map((event) => (
                  <option key={event.eventId} value={event.eventId}>
                    {event.eventName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="attendance-search" className="mb-2 block text-sm font-medium text-gray-700">
              Search participants
            </label>
            <div className="relative">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input id="attendance-search" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Name, enrollment number or team..." className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
          <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
            <Users size={21} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Attendance records</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{loading ? "—" : filteredRecords.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
          <div className="rounded-lg bg-gray-100 p-3 text-gray-700">
            <CalendarDays size={21} />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-gray-500">Selected event</p>
            <p className="mt-1 truncate text-base font-semibold text-gray-900">{selectedEvent?.eventName || "All Events"}</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-start gap-2">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
          <button type="button" onClick={fetchAttendanceData} className="flex shrink-0 items-center gap-2 text-sm font-medium underline sm:ml-auto">
            <RefreshCw size={15} />
            Retry
          </button>
        </div>
      )}

      {/* Attendance table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-1 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Check-in Details</h3>
            <p className="mt-1 text-xs text-gray-500">{selectedEvent ? `Attendance for ${selectedEvent.eventName}` : "Attendance across all events"}</p>
          </div>
          <span className="text-xs text-gray-500">{loading ? "Loading..." : `${filteredRecords.length} record(s)`}</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16 text-gray-500">
            <LoaderCircle size={26} className="animate-spin" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="px-6 py-14 text-center">
            {searchTerm.trim() ? (
              <>
                <Search size={34} className="mx-auto mb-3 text-gray-400" />
                <h3 className="font-medium text-gray-800">No matching records</h3>
                <p className="mt-1 text-sm text-gray-500">Try a different participant name, enrollment number or team.</p>
              </>
            ) : (
              <>
                <FileSpreadsheet size={36} className="mx-auto mb-3 text-gray-400" />
                <h3 className="font-medium text-gray-800">No attendance recorded yet</h3>
                <p className="mt-1 text-sm text-gray-500">{selectedEvent ? "No participants have been checked in for this event." : "Attendance records will appear here after participants are checked in."}</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1250px] w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  {COLUMNS.map((column) => (
                    <th key={column.key} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.map((record, index) => (
                  <tr key={`${record.userId}-${record.eventId}-${record.timestamp}-${index}`} className="transition hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">{record.name || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">{record.enrollmentNumber || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-500">{record.userId || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{record.teamName || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-500">{record.teamId || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{record.eventName || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-500">{record.eventId || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">{formatTimestamp(record.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs leading-5 text-gray-400">CSV export includes the currently selected event and search results. Timestamps in the CSV retain the original value returned by the API.</p>
    </div>
  );
}

export default Attendance;

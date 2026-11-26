import { useEffect, useMemo, useState } from "react";
import { Users, UserRound, IndianRupee, Search, LoaderCircle, AlertCircle, RefreshCw, ClipboardList, Eye, X } from "lucide-react";

import { adminApiRequest } from "../../lib/api";

const formatINR = (amountInPaise) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format((amountInPaise ?? 0) / 100);

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const StatusBadge = ({ status }) => {
  const verified = status?.toUpperCase() === "VERIFIED";

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${verified ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>{status || "UNKNOWN"}</span>;
};

function RegistrationsManager() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");

  const [registrations, setRegistrations] = useState(null);
  const [viewMode, setViewMode] = useState("TEAM");
  const [search, setSearch] = useState("");

  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [error, setError] = useState("");
  const [proofPreview, setProofPreview] = useState(null);
  const [loadingProofId, setLoadingProofId] = useState("");
  const [proofError, setProofError] = useState("");

  // Fetch available events
  useEffect(() => {
    let cancelled = false;

    const fetchEvents = async () => {
      setLoadingEvents(true);
      setError("");

      try {
        const data = await adminApiRequest("/api/admin/registrations/events");

        if (cancelled) return;

        const eventList = Array.isArray(data) ? data : [];
        setEvents(eventList);

        if (eventList.length > 0) {
          setSelectedEventId(eventList[0].eventId);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to fetch events.");
        }
      } finally {
        if (!cancelled) setLoadingEvents(false);
      }
    };

    fetchEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch registrations whenever the selected event changes
  useEffect(() => {
    if (!selectedEventId) {
      setRegistrations(null);
      return;
    }

    let cancelled = false;

    const fetchRegistrations = async () => {
      setLoadingRegistrations(true);
      setError("");
      setRegistrations(null);

      try {
        const data = await adminApiRequest(`/api/admin/registrations/${selectedEventId}`);

        if (!cancelled) {
          setRegistrations(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to fetch registrations.");
        }
      } finally {
        if (!cancelled) setLoadingRegistrations(false);
      }
    };

    fetchRegistrations();

    return () => {
      cancelled = true;
    };
  }, [selectedEventId]);

  const rows = useMemo(() => {
    if (!registrations) return [];

    const source = viewMode === "TEAM" ? registrations.teamRegistrations : registrations.individualRegistrations;

    const query = search.trim().toLowerCase();

    if (!query) return source ?? [];

    return (source ?? []).filter((item) => {
      const searchableValues = viewMode === "TEAM" ? [item.teamName, item.leaderName, item.leaderEmail, item.leaderPhoneNumber, item.transactionId, ...(item.members ?? []).flatMap((member) => [member.name, member.email])] : [item.name, item.email, item.teamName, item.transactionId, item.teamLeader ? "leader" : "member"];

      return searchableValues.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query),
      );
    });
  }, [registrations, viewMode, search]);

  const handleViewProof = async (registrationId) => {
    if (!registrationId) return;
    setLoadingProofId(registrationId);
    setProofError("");
    try {
      const response = await adminApiRequest(`/api/admin/registrations/${registrationId}/payment-proof`);
      if (!response?.signedUrl) throw new Error(response?.message || "Unable to retrieve payment proof.");
      setProofPreview({ url: response.signedUrl });
    } catch (err) {
      setProofError(err.message || "Unable to load payment proof.");
    } finally {
      setLoadingProofId("");
    }
  };

  const handleRefresh = () => {
    if (selectedEventId) {
      setSelectedEventId("");
      setTimeout(() => setSelectedEventId(events.find((event) => event.eventId === selectedEventId)?.eventId ?? ""), 0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <div className="flex items-center gap-2">
          <ClipboardList className="text-gray-700" size={23} />
          <h2 className="text-2xl font-semibold text-gray-900">Registrations</h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">Monitor event registrations and payment collections.</p>
      </div>

      {/* Event selector and view toggle */}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <label className="mb-1.5 block text-xs font-medium text-gray-500">SELECT EVENT</label>

          <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} disabled={loadingEvents || events.length === 0} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-gray-400">
            {loadingEvents ? (
              <option value="">Loading events...</option>
            ) : events.length === 0 ? (
              <option value="">No events available</option>
            ) : (
              events.map((event) => (
                <option key={event.eventId} value={event.eventId}>
                  {event.eventName}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button onClick={() => setViewMode("TEAM")} className={`rounded-md px-4 py-2 text-sm font-medium transition ${viewMode === "TEAM" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>
              Team-wise
            </button>

            <button onClick={() => setViewMode("INDIVIDUAL")} className={`rounded-md px-4 py-2 text-sm font-medium transition ${viewMode === "INDIVIDUAL" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>
              Individual
            </button>
          </div>

          <button onClick={handleRefresh} disabled={loadingRegistrations || !selectedEventId} title="Refresh registrations" className="rounded-lg border border-gray-200 p-2.5 text-gray-600 transition hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw size={17} className={loadingRegistrations ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Summary cards */}
      {registrations && !loadingRegistrations && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard icon={Users} label="Total Teams" value={registrations.totalTeams ?? 0} />

          <SummaryCard icon={UserRound} label="Total Participants" value={registrations.totalParticipants ?? 0} />

          <SummaryCard icon={IndianRupee} label="Total Collection" value={formatINR(registrations.totalCollectionInPaise)} highlight />
        </div>
      )}

      {/* Registrations table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{viewMode === "TEAM" ? "Team Registrations" : "Individual Registrations"}</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              {rows.length} {viewMode === "TEAM" ? "teams" : "participants"} found
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={viewMode === "TEAM" ? "Search team, leader, phone, member..." : "Search participant, email, team..."} className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-gray-400" />
          </div>
        </div>

        {loadingEvents || loadingRegistrations ? (
          <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-gray-500">
            <LoaderCircle size={20} className="animate-spin" />
            Loading registrations...
          </div>
        ) : !registrations ? (
          <div className="flex min-h-64 flex-col items-center justify-center text-center">
            <ClipboardList size={32} className="text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">{events.length === 0 ? "No events available." : "Select an event to view registrations."}</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center text-center">
            <Users size={32} className="text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-700">No registrations found</p>
            <p className="mt-1 text-xs text-gray-500">Try changing your search or selecting another event.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">{viewMode === "TEAM" ? <TeamTable rows={rows} onViewProof={handleViewProof} loadingProofId={loadingProofId} /> : <IndividualTable rows={rows} />}</div>
        )}
      </div>

      {proofError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{proofError}</div>}
      {registrations && <p className="text-xs text-gray-400">Collection includes verified payments only.</p>}
      {proofPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setProofPreview(null)}>
          <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h3 className="font-semibold text-gray-900">Payment Screenshot</h3>
                <p className="mt-0.5 text-xs text-gray-500">Private file · temporary access link</p>
              </div>
              <button type="button" onClick={() => setProofPreview(null)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Close preview">
                <X size={20} />
              </button>
            </div>
            <div className="flex max-h-[75vh] items-center justify-center overflow-auto bg-gray-50 p-4">
              <img src={proofPreview.url} alt="Payment proof" className="max-h-[68vh] max-w-full rounded-lg object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, highlight = false }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <Icon size={19} className={highlight ? "text-green-600" : "text-gray-400"} />
      </div>
      <p className="mt-3 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function TeamTable({ rows, onViewProof, loadingProofId }) {
  return (
    <table className="w-full min-w-[1180px] text-left text-sm">
      <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
        <tr>
          <th className="px-5 py-3 font-medium">Team</th>
          <th className="px-5 py-3 font-medium">Team Members</th>
          <th className="px-5 py-3 font-medium">Registered On</th>
          <th className="px-5 py-3 font-medium">Payment</th>
          <th className="px-5 py-3 font-medium">Proof</th>
          <th className="px-5 py-3 font-medium">Transaction ID</th>
          <th className="px-5 py-3 text-right font-medium">Amount Paid</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-100">
        {rows.map((team) => (
          <tr key={team.teamId} className="hover:bg-gray-50/70">
            <td className="px-5 py-4 align-top">
              <p className="font-medium text-gray-900">{team.teamName}</p>

              <p className="mt-1 text-xs text-gray-500">Leader: {team.leaderName}</p>

              <p className="text-xs text-gray-400">{team.leaderEmail}</p>

              {team.leaderPhoneNumber ? (
                <a href={`tel:${team.leaderPhoneNumber}`} className="mt-1 inline-block text-xs font-medium text-blue-600 hover:underline">
                  {team.leaderPhoneNumber}
                </a>
              ) : (
                <p className="mt-1 text-xs text-gray-400">Phone: Not provided</p>
              )}
            </td>

            <td className="px-5 py-4 align-top">
              <div className="space-y-2">
                {(team.members ?? []).map((member) => (
                  <div key={member.userId}>
                    <p className="text-gray-800">{member.name}</p>
                    <p className="text-xs text-gray-400">{member.email}</p>
                  </div>
                ))}
              </div>
            </td>

            <td className="whitespace-nowrap px-5 py-4 text-gray-600">{formatDate(team.registrationDate)}</td>

            <td className="px-5 py-4">
              <StatusBadge status={team.paymentStatus} />
            </td>

            <td className="px-5 py-4">
              {team.paymentScreenshotUploaded ? (
                <button type="button" onClick={() => onViewProof(team.registrationId)} disabled={loadingProofId === team.registrationId} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                  {loadingProofId === team.registrationId ? <LoaderCircle size={14} className="animate-spin" /> : <Eye size={14} />} View Screenshot
                </button>
              ) : (
                <span className="text-xs text-gray-400">Not uploaded</span>
              )}
            </td>
            <td className="px-5 py-4 text-xs text-gray-500">{team.transactionId || "—"}</td>

            <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-gray-900">{formatINR(team.amountInPaise)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function IndividualTable({ rows }) {
  return (
    <table className="w-full min-w-[1050px] text-left text-sm">
      <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
        <tr>
          <th className="px-5 py-3 font-medium">Participant</th>
          <th className="px-5 py-3 font-medium">Team</th>
          <th className="px-5 py-3 font-medium">Role</th>
          <th className="px-5 py-3 font-medium">Registered On</th>
          <th className="px-5 py-3 font-medium">Payment</th>
          <th className="px-5 py-3 font-medium">Transaction ID</th>
          <th className="px-5 py-3 text-right font-medium">Team Amount</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-100">
        {rows.map((participant) => (
          <tr key={`${participant.userId}-${participant.teamId}`} className="hover:bg-gray-50/70">
            <td className="px-5 py-4">
              <p className="font-medium text-gray-900">{participant.name}</p>
              <p className="text-xs text-gray-400">{participant.email}</p>
            </td>

            <td className="px-5 py-4 text-gray-700">{participant.teamName}</td>

            <td className="px-5 py-4">
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">{participant.teamLeader ? "Leader" : "Member"}</span>
            </td>

            <td className="whitespace-nowrap px-5 py-4 text-gray-600">{formatDate(participant.registrationDate)}</td>

            <td className="px-5 py-4">
              <StatusBadge status={participant.paymentStatus} />
            </td>

            <td className="px-5 py-4 text-xs text-gray-500">{participant.transactionId || "—"}</td>

            <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-gray-900">{formatINR(participant.teamAmountInPaise)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default RegistrationsManager;

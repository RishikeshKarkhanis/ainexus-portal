import { useEffect, useMemo, useState } from "react";
import { UserPlus, Search, Users, CalendarDays, IndianRupee, LoaderCircle, AlertCircle, CheckCircle2, X, CreditCard, ShieldCheck, RefreshCw } from "lucide-react";

import { adminApiRequest } from "../../lib/api";

const EMPTY_FORM = {
  teamName: "",
  leader: null,
  leaderPhoneNumber: "",
  members: [],
  transactionId: "",
  paymentStatus: "PENDING",
};

export default function ManualRegistration() {
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const [loadingEvents, setLoadingEvents] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedEvent = useMemo(() => events.find((event) => String(event.eventId) === String(eventId)), [events, eventId]);

  // Load events
  useEffect(() => {
    let cancelled = false;

    const loadEvents = async () => {
      try {
        setLoadingEvents(true);

        const data = await adminApiRequest("/api/events");

        if (cancelled) return;

        const list = Array.isArray(data) ? data : [];

        setEvents(list);

        if (list.length > 0) {
          setEventId(String(list[0].eventId));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load events.");
        }
      } finally {
        if (!cancelled) setLoadingEvents(false);
      }
    };

    loadEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  // Search existing portal users
  useEffect(() => {
    const query = userQuery.trim();

    if (query.length < 2) {
      setUserResults([]);
      setSearchingUsers(false);
      return undefined;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setSearchingUsers(true);

      try {
        const data = await adminApiRequest(`/api/admin/management/search?q=${encodeURIComponent(query)}`);

        if (cancelled) return;

        const selectedIds = new Set([form.leader?.userId, ...form.members.map((member) => member.userId)].filter(Boolean));

        setUserResults((Array.isArray(data) ? data : []).filter((user) => !selectedIds.has(user.userId)));
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to search users.");
        }
      } finally {
        if (!cancelled) setSearchingUsers(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [userQuery, form.leader, form.members]);

  const addLeader = (user) => {
    setForm((current) => ({
      ...current,
      leader: user,
      members: current.members.filter((member) => member.userId !== user.userId),
    }));

    setUserQuery("");
    setUserResults([]);
    setError("");
  };

  const addMember = (user) => {
    if (form.members.some((member) => member.userId === user.userId)) return;
    if (form.leader?.userId === user.userId) return;

    setForm((current) => ({
      ...current,
      members: [...current.members, user],
    }));

    setUserQuery("");
    setUserResults([]);
    setError("");
  };

  const removeMember = (userId) => {
    setForm((current) => ({
      ...current,
      members: current.members.filter((member) => member.userId !== userId),
    }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setUserQuery("");
    setUserResults([]);
    setError("");
    setSuccess("");
  };

  const totalTeamSize = (form.leader ? 1 : 0) + form.members.length;

  const minTeamSize = selectedEvent?.minTeamSize ?? 1;
  const maxTeamSize = selectedEvent?.maxTeamSize ?? 1;

  const isPaidEvent = Number(selectedEvent?.registrationFee ?? 0) > 0;

  // Submit manual registration
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!eventId) {
      setError("Select an event.");
      return;
    }

    if (!form.leader) {
      setError("Select a team leader.");
      return;
    }

    if (!/^(?:\+91[- ]?)?[6-9]\d{9}$/.test(form.leaderPhoneNumber.trim())) {
      return setError("Enter a valid Indian mobile number for the team leader.");
    }

    if (totalTeamSize < minTeamSize || totalTeamSize > maxTeamSize) {
      setError(`Team size must be between ${minTeamSize} and ${maxTeamSize}.`);
      return;
    }

    if (form.teamName.trim().length < 3) {
      setError("Team name must contain at least 3 characters.");
      return;
    }

    if (!form.transactionId.trim()) {
      setError("Enter the UPI transaction ID / UTR.");
      return;
    }

    if (!isPaidEvent) {
      setError("This form currently supports paid events only.");
      return;
    }

    if (form.paymentStatus === "VERIFIED") {
      const confirmed = window.confirm(`Confirm that payment has been received in the official college account.\n\nTeam: ${form.teamName}\nUTR: ${form.transactionId}`);

      if (!confirmed) return;
    }

    const payload = {
      eventId,
      teamName: form.teamName.trim(),
      leaderId: form.leader.userId,
      memberIds: form.members.map((member) => member.userId),
      transactionId: form.transactionId.trim(),
      leaderPhoneNumber: form.leaderPhoneNumber.trim(),
      paymentStatus: form.paymentStatus,
    };

    try {
      setSubmitting(true);

      const result = await adminApiRequest("/api/admin/registrations/manual", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSuccess(`Registration created successfully! Registration ID: ${result.registrationId}. Payment: ${result.paymentStatus}.`);

      setForm(EMPTY_FORM);
      setUserQuery("");
      setUserResults([]);
    } catch (err) {
      setError(err.message || "Unable to create manual registration.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
            <UserPlus size={18} />
            REGISTRATION MANAGEMENT
          </div>

          <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">Manual Registration</h1>

          <p className="mt-2 text-sm text-gray-500">Register participants when the public registration flow fails.</p>
        </div>

        <button type="button" onClick={resetForm} disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <RefreshCw size={16} />
          Reset form
        </button>
      </div>

      {/* Feedback */}
      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div role="status" className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
              <CalendarDays size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">Event details</h2>
              <p className="text-xs text-gray-500">Select the event for this registration.</p>
            </div>
          </div>

          <label htmlFor="manual-event" className="mb-2 block text-sm font-medium text-gray-700">
            Event
          </label>

          <select id="manual-event" value={eventId} onChange={(e) => setEventId(e.target.value)} disabled={loadingEvents || !events.length} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-gray-50">
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

          {selectedEvent && (
            <div className="mt-4 grid gap-3 rounded-lg bg-gray-50 p-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-gray-500">Registration fee</p>
                <p className="mt-1 flex items-center gap-1 font-semibold text-gray-900">
                  <IndianRupee size={15} />
                  {selectedEvent.registrationFee ?? 0}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Team size</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {minTeamSize}–{maxTeamSize} members
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Registration status</p>
                <p className="mt-1 font-semibold text-gray-900">{selectedEvent.registrationStatus || "—"}</p>
              </div>
            </div>
          )}
        </section>

        {/* Team details */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-violet-50 p-2.5 text-violet-600">
              <Users size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">Team information</h2>
              <p className="text-xs text-gray-500">Search existing portal accounts by name or email.</p>
            </div>
          </div>

          <label htmlFor="manual-team-name" className="mb-2 block text-sm font-medium text-gray-700">
            Team name
          </label>

          <input
            id="manual-team-name"
            value={form.teamName}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                teamName: e.target.value,
              }))
            }
            maxLength={120}
            placeholder="Enter team name"
            className="mb-5 w-full rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
          />

          <label htmlFor="manual-user-search" className="mb-2 block text-sm font-medium text-gray-700">
            Find participant
          </label>

          <div className="relative">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

            <input id="manual-user-search" value={userQuery} onChange={(e) => setUserQuery(e.target.value)} placeholder="Type at least 2 characters..." className="w-full rounded-lg border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500" />
          </div>

          {userQuery.trim().length >= 2 && (
            <div className="mt-2 overflow-hidden rounded-lg border border-gray-200">
              {searchingUsers ? (
                <div className="flex items-center gap-2 p-4 text-sm text-gray-500">
                  <LoaderCircle size={16} className="animate-spin" />
                  Searching users...
                </div>
              ) : userResults.length ? (
                userResults.map((user) => (
                  <div key={user.userId} className="flex flex-col gap-2 border-b border-gray-100 p-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="truncate text-xs text-gray-500">{user.email}</p>
                    </div>

                    <div className="flex gap-2">
                      <button type="button" onClick={() => addLeader(user)} className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                        Set as leader
                      </button>

                      <button type="button" onClick={() => addMember(user)} className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700">
                        Add member
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-4 text-sm text-gray-500">No matching users found.</p>
              )}
            </div>
          )}

          {/* Selected participants */}
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {/* Leader */}
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Team leader</p>

              {form.leader ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{form.leader.name}</p>
                    <p className="truncate text-xs text-gray-500">{form.leader.email}</p>
                  </div>

                  <button
                    type="button"
                    aria-label="Remove team leader"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        leader: null,
                      }))
                    }
                    className="rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No leader selected.</p>
              )}
            </div>

            {/* Members */}
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Team members</p>
                <span className="text-xs text-gray-500">
                  {totalTeamSize}/{maxTeamSize}
                </span>
              </div>

              {form.members.length ? (
                <div className="space-y-3">
                  {form.members.map((member) => (
                    <div key={member.userId} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{member.name}</p>
                        <p className="truncate text-xs text-gray-500">{member.email}</p>
                      </div>

                      <button type="button" aria-label={`Remove ${member.name}`} onClick={() => removeMember(member.userId)} className="rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No additional members selected.</p>
              )}
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Selected team size: {totalTeamSize}. Required: {minTeamSize}–{maxTeamSize}.
          </p>

          <div className="mt-5">
            <label htmlFor="manual-leader-phone" className="mb-2 block text-sm font-medium text-gray-700">
              Team Leader's Phone Number
            </label>

            <input
              id="manual-leader-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={form.leaderPhoneNumber}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  leaderPhoneNumber: e.target.value.replace(/[^\d+\s-]/g, ""),
                }))
              }
              maxLength={15}
              placeholder="Enter leader's 10-digit mobile number"
              className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
            />

            <p className="mt-2 text-xs text-gray-500">Contact number of the selected team leader.</p>
          </div>
        </section>

        {/* Payment */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
              <CreditCard size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">Payment details</h2>
              <p className="text-xs text-gray-500">Only PENDING and VERIFIED are available.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="manual-utr" className="mb-2 block text-sm font-medium text-gray-700">
                UPI transaction ID / UTR
              </label>

              <input
                id="manual-utr"
                value={form.transactionId}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    transactionId: e.target.value,
                  }))
                }
                maxLength={100}
                placeholder="Enter transaction reference"
                className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="manual-payment-status" className="mb-2 block text-sm font-medium text-gray-700">
                Payment status
              </label>

              <select
                id="manual-payment-status"
                value={form.paymentStatus}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    paymentStatus: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500">
                <option value="PENDING">Pending verification</option>
                <option value="VERIFIED">Verified</option>
              </select>
            </div>
          </div>

          {form.paymentStatus === "VERIFIED" && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <ShieldCheck size={18} className="mt-0.5 shrink-0" />
              <p>Verified registrations immediately create the team, tickets and confirmation emails. Confirm payment against official account records before proceeding.</p>
            </div>
          )}
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={resetForm} disabled={submitting} className="rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            Clear
          </button>

          <button type="submit" disabled={submitting || loadingEvents || !events.length} className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? <LoaderCircle size={17} className="animate-spin" /> : <UserPlus size={17} />}

            {submitting ? "Creating registration..." : "Create Manual Registration"}
          </button>
        </div>
      </form>
    </div>
  );
}

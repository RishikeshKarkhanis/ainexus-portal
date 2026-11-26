import { useCallback, useEffect, useState } from "react";
import { IndianRupee, RefreshCw, Search, CheckCircle2, XCircle, Clock, CalendarDays, User, Mail, Phone, CreditCard, LoaderCircle, AlertCircle, ShieldCheck, ChevronDown, Image as ImageIcon, X, ExternalLink } from "lucide-react";

import { adminApiRequest } from "../../lib/api";

export default function PaymentVerification() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");

  const [payments, setPayments] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const [actionPaymentId, setActionPaymentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [screenshotPayment, setScreenshotPayment] = useState(null);
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [loadingScreenshotId, setLoadingScreenshotId] = useState(null);
  const [screenshotError, setScreenshotError] = useState("");

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      setLoadingEvents(true);
      setError("");

      const data = await adminApiRequest("/api/events");

      const eventList = Array.isArray(data) ? data : [];
      setEvents(eventList);

      if (eventList.length > 0) {
        setSelectedEvent((previous) => {
          const stillExists = eventList.some((event) => event.eventId === previous);

          return stillExists ? previous : eventList[0].eventId;
        });
      }
    } catch (err) {
      setError(err.message || "Unable to fetch events.");
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  // Fetch pending payments for selected event
  const fetchPayments = useCallback(async () => {
    if (!selectedEvent) {
      setPayments([]);
      return;
    }

    try {
      setLoadingPayments(true);
      setError("");

      const data = await adminApiRequest(`/api/admin/payments/${selectedEvent}/pending`);

      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to fetch pending payments.");
    } finally {
      setLoadingPayments(false);
    }
  }, [selectedEvent]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (selectedEvent) {
      fetchPayments();
    }
  }, [selectedEvent, fetchPayments]);

  // Load a private payment screenshot through an admin-only signed-URL endpoint.
  const handleViewScreenshot = async (payment) => {
    try {
      setLoadingScreenshotId(payment.paymentId);
      setScreenshotError("");
      setScreenshotUrl("");
      setScreenshotPayment(payment);

      const data = await adminApiRequest(`/api/admin/registrations/${payment.registrationId}/payment-proof`);

      const url = typeof data === "string" ? data : data?.signedUrl || data?.url;

      if (!url) {
        throw new Error("The server did not return a screenshot URL.");
      }

      setScreenshotUrl(url);
    } catch (err) {
      setScreenshotPayment(null);
      setScreenshotError(err.message || "Unable to load payment screenshot.");
    } finally {
      setLoadingScreenshotId(null);
    }
  };

  const closeScreenshot = () => {
    setScreenshotPayment(null);
    setScreenshotUrl("");
  };

  // Verify payment
  const handleVerify = async (payment) => {
    const confirmed = window.confirm(`Have you confirmed receipt of the UPI payment?\n\nTeam: ${payment.teamName}\nUTR: ${payment.transactionId}`);

    if (!confirmed) return;

    try {
      setActionPaymentId(payment.paymentId);
      setError("");
      setSuccess("");

      await adminApiRequest(`/api/admin/payments/${payment.paymentId}/verify`, {
        method: "POST",
      });

      setSuccess(`Payment verified successfully for ${payment.teamName}.`);

      await fetchPayments();
    } catch (err) {
      setError(err.message || "Unable to verify payment.");
    } finally {
      setActionPaymentId(null);
    }
  };

  // Reject payment
  const handleReject = async (payment) => {
    const confirmed = window.confirm(`Are you sure you want to reject this payment?\n\nTeam: ${payment.teamName}\nUTR: ${payment.transactionId}`);

    if (!confirmed) return;

    try {
      setActionPaymentId(payment.paymentId);
      setError("");
      setSuccess("");

      await adminApiRequest(`/api/admin/payments/${payment.paymentId}/reject`, {
        method: "POST",
      });

      setSuccess(`Payment rejected for ${payment.teamName}.`);

      await fetchPayments();
    } catch (err) {
      setError(err.message || "Unable to reject payment.");
    } finally {
      setActionPaymentId(null);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return true;

    return [payment.teamName, payment.leaderName, payment.leaderEmail, payment.leaderPhoneNumber, payment.transactionId, ...(payment.members || []).map((member) => member.name)].filter(Boolean).some((value) => value.toLowerCase().includes(query));
  });

  const selectedEventDetails = events.find((event) => event.eventId === selectedEvent);

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatAmount = (amount) => {
    if (amount == null) return "—";

    // Backend stores amount in paise.
    return `₹${(amount / 100).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
            <ShieldCheck size={17} />
            PAYMENT MANAGEMENT
          </div>

          <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">Payment Verification</h1>

          <p className="mt-2 text-sm text-gray-500">Review submitted UPI transactions and verify payments manually.</p>
        </div>

        <button type="button" onClick={fetchPayments} disabled={!selectedEvent || loadingPayments} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
          <RefreshCw size={16} className={loadingPayments ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Event selector and summary */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2">
          <label htmlFor="paymentEvent" className="mb-2 block text-sm font-semibold text-gray-700">
            Select Event
          </label>

          <div className="relative">
            <select
              id="paymentEvent"
              value={selectedEvent}
              onChange={(e) => {
                setSelectedEvent(e.target.value);
                setSuccess("");
                setError("");
                setSearchQuery("");
              }}
              disabled={loadingEvents || events.length === 0}
              className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50">
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

            <ChevronDown size={17} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          {selectedEventDetails && (
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={14} />
                {selectedEventDetails.eventDate || "Date not announced"}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <IndianRupee size={14} />
                Fee: ₹{selectedEventDetails.registrationFee ?? 0}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Clock size={24} />
          </div>

          <div>
            <p className="text-sm font-medium text-amber-800">Pending Verification</p>
            <p className="mt-1 text-3xl font-bold text-amber-900">{payments.length}</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div role="status" className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          {success}
        </div>
      )}

      {screenshotError && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {screenshotError}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by team, leader, email, phone or UTR..." className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
      </div>

      {/* Pending payments */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Submitted Payments</h2>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">{filteredPayments.length} records</span>
        </div>

        {loadingEvents || loadingPayments ? (
          <div className="flex min-h-48 items-center justify-center rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <LoaderCircle size={20} className="animate-spin" />
              Loading payment records...
            </div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <CreditCard size={26} />
            </div>

            <h3 className="mt-4 text-base font-semibold text-gray-800">{payments.length === 0 ? "No pending payments" : "No matching payments"}</h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">{payments.length === 0 ? "There are currently no UPI payment submissions awaiting verification for this event." : "Try searching with another team name, leader name or transaction ID."}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredPayments.map((payment) => {
              const isProcessing = actionPaymentId === payment.paymentId;

              return (
                <div key={payment.paymentId} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  {/* Payment header */}
                  <div className="flex flex-col justify-between gap-3 border-b border-gray-100 bg-gray-50/80 p-5 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{payment.teamName}</h3>

                      <p className="mt-1 text-xs text-gray-500">Submitted: {formatDate(payment.submittedAt)}</p>
                    </div>

                    <div className="flex items-center gap-2 self-start rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 sm:self-center">
                      <Clock size={14} />
                      {payment.paymentStatus || "UNVERIFIED"}
                    </div>
                  </div>

                  <div className="grid gap-6 p-5 lg:grid-cols-2">
                    {/* Leader details */}
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Team Leader</p>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <User size={19} />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-gray-900">{payment.leaderName}</p>
                            <p className="text-xs text-gray-500">Team Leader</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail size={15} className="text-gray-400" />
                          {payment.leaderEmail}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone size={15} className="text-gray-400" />
                          {payment.leaderPhoneNumber ? (
                            <a href={`tel:${payment.leaderPhoneNumber}`} className="font-medium text-blue-600 hover:underline">
                              {payment.leaderPhoneNumber}
                            </a>
                          ) : (
                            <span className="text-gray-400">Not provided</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Team members */}
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Team Members ({(payment.members || []).length})</p>

                      <div className="space-y-3">
                        {(payment.members || []).length === 0 ? (
                          <p className="text-sm text-gray-500">No additional members.</p>
                        ) : (
                          payment.members.map((member) => (
                            <div key={member.userId} className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">{member.name?.charAt(0)?.toUpperCase() || "U"}</div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-gray-800">{member.name}</p>
                                <p className="truncate text-xs text-gray-500">{member.email}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Transaction details */}
                  <div className="mx-5 mb-5 grid gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-gray-500">UPI Transaction ID / UTR</p>
                      <p className="mt-1 break-all font-mono text-sm font-semibold text-gray-900">{payment.transactionId || "Not available"}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500">Amount Submitted</p>
                      <p className="mt-1 text-lg font-bold text-gray-900">{formatAmount(payment.amount)}</p>
                    </div>
                  </div>

                  {/* Payment screenshot */}
                  <div className="mx-5 mb-5 flex flex-col gap-3 rounded-lg border border-blue-100 bg-blue-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                        <ImageIcon size={19} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Payment screenshot</p>
                        <p className="mt-1 text-xs text-gray-500">Open the uploaded UPI proof before verifying this transaction.</p>
                      </div>
                    </div>

                    <button type="button" onClick={() => handleViewScreenshot(payment)} disabled={loadingScreenshotId === payment.paymentId} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60">
                      {loadingScreenshotId === payment.paymentId ? <LoaderCircle size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                      View Screenshot
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col-reverse gap-3 border-t border-gray-100 p-5 sm:flex-row sm:justify-end">
                    <button type="button" onClick={() => handleReject(payment)} disabled={!!actionPaymentId} className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">
                      {isProcessing ? <LoaderCircle size={16} className="animate-spin" /> : <XCircle size={16} />}
                      Reject Payment
                    </button>

                    <button type="button" onClick={() => handleVerify(payment)} disabled={!!actionPaymentId} className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50">
                      {isProcessing ? <LoaderCircle size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      Verify Payment
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Verification reminder */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <ShieldCheck size={20} className="mt-0.5 shrink-0 text-blue-600" />

        <div>
          <p className="text-sm font-semibold text-blue-900">Verify before approving</p>
          <p className="mt-1 text-xs leading-5 text-blue-700">Always confirm the transaction ID and payment amount against the official college bank or UPI records before approving. A submitted UTR alone is not proof of payment.</p>
        </div>
      </div>

      {/* Private payment screenshot preview */}
      {screenshotPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label={`Payment screenshot for ${screenshotPayment.teamName}`} onClick={closeScreenshot}>
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Payment Screenshot</h2>
                <p className="mt-1 text-xs text-gray-500">
                  {screenshotPayment.teamName} · UTR: {screenshotPayment.transactionId || "Not available"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {screenshotUrl && (
                  <a href={screenshotUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <ExternalLink size={15} />
                    Open original
                  </a>
                )}
                <button type="button" onClick={closeScreenshot} aria-label="Close screenshot preview" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex min-h-64 items-center justify-center overflow-auto bg-gray-950 p-4">
              {loadingScreenshotId === screenshotPayment.paymentId || !screenshotUrl ? (
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <LoaderCircle size={20} className="animate-spin" />
                  Loading screenshot...
                </div>
              ) : (
                <img src={screenshotUrl} alt={`Payment proof uploaded by ${screenshotPayment.teamName}`} className="max-h-[72vh] max-w-full rounded-lg object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

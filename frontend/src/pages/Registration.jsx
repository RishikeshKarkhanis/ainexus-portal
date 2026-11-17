import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { ArrowLeft, CalendarDays, IndianRupee, Building2, Users, UserPlus, AlertCircle, LoaderCircle, Search, X, Check, Crown } from "lucide-react";

import { apiRequest } from "../lib/api";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

function getThumbnailUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;

  return `${SUPABASE_URL}/storage/v1/object/public/ainexus-assets/${path}`;
}

function formatDate(date) {
  if (!date) return "Date to be announced";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Registration() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formationStarted, setFormationStarted] = useState(false);
  const [teamName, setTeamName] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Fetch event details
  useEffect(() => {
    let isMounted = true;

    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError("");

        if (!localStorage.getItem("authToken")) {
          throw new Error("Please log in before registering for an event.");
        }

        const data = await apiRequest(`/api/events/${eventId}`);

        if (isMounted) {
          setEvent(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Unable to load event details.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchEvent();

    return () => {
      isMounted = false;
    };
  }, [eventId]);

  // Search teammates
  useEffect(() => {
    if (!formationStarted || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError("");
      return;
    }

    let isMounted = true;

    const timeout = setTimeout(async () => {
      try {
        setSearchLoading(true);
        setSearchError("");

        const results = await apiRequest(`/api/users/search?eventId=${encodeURIComponent(eventId)}&q=${encodeURIComponent(searchQuery.trim())}`);

        if (isMounted) {
          // Hide only members already selected.
          // Do NOT hide users registered for this event.
          setSearchResults(results.filter((user) => !selectedMembers.some((member) => member.userId === user.userId)));
        }
      } catch (err) {
        if (isMounted) {
          setSearchError(err.message || "Unable to search users.");
        }
      } finally {
        if (isMounted) {
          setSearchLoading(false);
        }
      }
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [searchQuery, formationStarted, eventId, selectedMembers]);

  // Add teammate
  const addMember = (user) => {
    if (user.alreadyRegistered) return;

    const maxSize = event?.maxTeamSize;

    if (selectedMembers.length + 1 >= maxSize) return;

    setSelectedMembers((previous) => [...previous, user]);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Remove teammate
  const removeMember = (userId) => {
    setSelectedMembers((previous) => previous.filter((member) => member.userId !== userId));
  };

  // Initiate Razorpay payment
  const handlePayment = async () => {
    if (!canProceedToPayment || paymentLoading) return;

    try {
      setPaymentLoading(true);
      setPaymentError("");

      const order = await apiRequest("/api/payments/create-order", {
        method: "POST",
        body: JSON.stringify({
          eventId,
          teamName: teamName.trim(),
          memberIds: selectedMembers.map((member) => member.userId),
        }),
      });

      if (!window.Razorpay) {
        throw new Error("Razorpay Checkout failed to load. Please refresh the page.");
      }

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "AI Nexus",
        description: event.eventName,
        order_id: order.orderId,

        // Verify payment with backend
        handler: async function (response) {
          try {
            setPaymentError("");

            await apiRequest("/api/payments/verify", {
              method: "POST",
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            // Show success popup only after verification
            setPaymentSuccess(true);
          } catch (err) {
            console.error("Payment verification failed:", err);

            setPaymentError(`Payment received, but verification failed. Please contact the AI Nexus team with Payment ID: ${response.razorpay_payment_id}`);
          }
        },

        theme: {
          color: "#4f46e5",
        },

        modal: {
          ondismiss: function () {
            setPaymentError("Payment window closed.");
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function (response) {
        setPaymentError(response.error?.description || "Payment failed. Please try again.");
      });

      razorpay.open();
    } catch (err) {
      setPaymentError(err.message || "Unable to initiate payment.");
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090a0f] text-white">
        <div className="flex items-center gap-3 text-gray-400">
          <LoaderCircle className="animate-spin" size={22} />
          Loading event details...
        </div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090a0f] px-5 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111318] p-8 text-center">
          <AlertCircle className="mx-auto mb-4 text-red-400" size={36} />

          <h1 className="text-xl font-semibold">Unable to continue</h1>

          <p className="mt-3 text-sm leading-relaxed text-gray-400">{error || "Event not found."}</p>

          {!localStorage.getItem("authToken") && (
            <Link to="/auth" className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-3 text-sm font-medium hover:bg-indigo-500">
              Log In
            </Link>
          )}

          <div>
            <Link to="/events" className="mt-6 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
              <ArrowLeft size={16} />
              Back to Events
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const thumbnail = getThumbnailUrl(event.thumbnailPath);
  const registrationOpen = event.registrationStatus === "OPEN";

  const minSize = event.minTeamSize;
  const maxSize = event.maxTeamSize;

  const teamSize = minSize != null && maxSize != null ? `${minSize} – ${maxSize} members` : "Not configured";

  const currentTeamSize = selectedMembers.length + 1;

  const teamSizeValid = minSize != null && maxSize != null && currentTeamSize >= minSize && currentTeamSize <= maxSize;

  const teamNameValid = teamName.trim().length >= 3 && teamName.trim().length <= 120;

  const canProceedToPayment = registrationOpen && teamSizeValid && teamNameValid;

  return (
    <main className="min-h-screen bg-[#090a0f] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <Link to="/events" className="inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white">
          <ArrowLeft size={17} />
          Back to Events
        </Link>

        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-400">AI Nexus · Acropolis</p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Event Registration</h1>

          <p className="mt-2 text-gray-400">Review the event details before proceeding.</p>
        </header>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111318]">
          {thumbnail && (
            <div className="aspect-video w-full overflow-hidden bg-[#1c1f26]">
              <img src={thumbnail} alt={event.eventName} className="h-full w-full object-cover" />
            </div>
          )}

          <div className="space-y-7 p-6 sm:p-8">
            <div>
              <div className="mb-3">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${registrationOpen ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{registrationOpen ? "Registration Open" : "Registration Closed"}</span>
              </div>

              <h2 className="text-2xl font-bold sm:text-3xl">{event.eventName}</h2>

              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-gray-400">{event.description || "No description available."}</p>
            </div>

            {/* Event Details */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <CalendarDays className="shrink-0 text-indigo-400" size={22} />
                <div>
                  <p className="text-xs text-gray-500">Event Date</p>
                  <p className="mt-1 text-sm font-medium">{formatDate(event.eventDate)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <IndianRupee className="shrink-0 text-indigo-400" size={22} />
                <div>
                  <p className="text-xs text-gray-500">Registration Fee</p>
                  <p className="mt-1 text-sm font-medium">{event.registrationFee > 0 ? `₹${event.registrationFee}` : "Free"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <Building2 className="shrink-0 text-indigo-400" size={22} />
                <div>
                  <p className="text-xs text-gray-500">Eligibility</p>
                  <p className="mt-1 text-sm font-medium">{event.collegeOnly ? "Acropolis Students Only" : "Open to All"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <Users className="shrink-0 text-indigo-400" size={22} />
                <div>
                  <p className="text-xs text-gray-500">Registration Status</p>
                  <p className="mt-1 text-sm font-medium">{event.registrationStatus}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <UserPlus className="shrink-0 text-indigo-400" size={22} />
                <div>
                  <p className="text-xs text-gray-500">Team Size</p>
                  <p className="mt-1 text-sm font-medium">{teamSize}</p>
                </div>
              </div>
            </div>

            {!formationStarted ? (
              <div className="border-t border-white/10 pt-6">
                <button type="button" disabled={!registrationOpen} onClick={() => setFormationStarted(true)} className="w-full rounded-xl bg-indigo-600 px-6 py-4 text-sm font-semibold transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400">
                  {registrationOpen ? "Continue to Team Formation" : "Registration Closed"}
                </button>

                <p className="mt-3 text-center text-xs text-gray-500">Team formation and payment will follow in the next step.</p>
              </div>
            ) : (
              <div className="space-y-6 border-t border-white/10 pt-6">
                <div>
                  <h3 className="text-xl font-semibold">Build Your Team</h3>
                  <p className="mt-2 text-sm text-gray-400">Enter your team name and add existing AI Nexus users.</p>
                </div>

                {/* Team Name */}
                <div>
                  <label htmlFor="teamName" className="mb-3 block text-sm font-medium text-gray-300">
                    Team Name
                  </label>

                  <input id="teamName" type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} maxLength={120} placeholder="Enter your team name..." className="w-full rounded-xl border border-white/10 bg-[#090a0f] px-4 py-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-indigo-500" />

                  <div className="mt-2 flex justify-between text-xs">
                    <span className="text-gray-500">Minimum 3 characters.</span>
                    <span className="text-gray-500">{teamName.length}/120</span>
                  </div>
                </div>

                {/* Team Size */}
                <div className="flex items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-500/[0.06] p-4">
                  <div>
                    <p className="text-sm font-medium">Team Members</p>
                    <p className="mt-1 text-xs text-gray-400">
                      Minimum {minSize} · Maximum {maxSize}
                    </p>
                  </div>

                  <p className="text-xl font-bold text-indigo-400">
                    {currentTeamSize}/{maxSize ?? "—"}
                  </p>
                </div>

                {/* Team Leader */}
                <div>
                  <p className="mb-3 text-sm font-medium text-gray-300">Your Team</p>

                  <div className="flex items-center gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/[0.06] p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20">
                      <Crown className="text-indigo-400" size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">You</p>
                      <p className="text-xs text-indigo-400">Team Leader</p>
                    </div>

                    <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300">Leader</span>
                  </div>
                </div>

                {/* Selected Teammates */}
                {selectedMembers.length > 0 && (
                  <div className="space-y-3">
                    {selectedMembers.map((member) => (
                      <div key={member.userId} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">{member.name?.charAt(0)?.toUpperCase()}</div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{member.name}</p>
                          <p className="truncate text-xs text-gray-500">{member.email}</p>
                        </div>

                        <button type="button" onClick={() => removeMember(member.userId)} className="rounded-lg p-2 text-gray-500 transition hover:bg-red-500/10 hover:text-red-400" aria-label={`Remove ${member.name}`}>
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search Teammates */}
                {currentTeamSize < maxSize && (
                  <div>
                    <label className="mb-3 block text-sm font-medium text-gray-300">Add Teammates</label>

                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />

                      <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name or email..." className="w-full rounded-xl border border-white/10 bg-[#090a0f] py-4 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-indigo-500" />

                      {searchLoading && <LoaderCircle className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-indigo-400" size={18} />}
                    </div>

                    <p className="mt-2 text-xs text-gray-500">Enter at least 2 characters to search.</p>

                    {searchError && <p className="mt-3 text-sm text-red-400">{searchError}</p>}

                    {searchQuery.trim().length >= 2 && !searchLoading && !searchError && searchResults.length === 0 && <p className="mt-4 text-center text-sm text-gray-500">No matching users found.</p>}

                    {searchResults.length > 0 && (
                      <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
                        {searchResults.map((user) => {
                          const alreadyRegistered = user.alreadyRegistered === true;

                          return (
                            <div key={user.userId} className={`flex w-full items-center gap-3 border-b border-white/5 p-4 last:border-b-0 ${alreadyRegistered ? "bg-white/[0.015] opacity-60" : "transition hover:bg-white/[0.05]"}`}>
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-sm font-semibold text-indigo-400">{user.name?.charAt(0)?.toUpperCase()}</div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{user.name}</p>
                                <p className="truncate text-xs text-gray-500">{user.email}</p>
                              </div>

                              {alreadyRegistered ? (
                                <span className="shrink-0 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400">Registered</span>
                              ) : (
                                <button type="button" onClick={() => addMember(user)} disabled={alreadyRegistered} aria-label={`Add ${user.name}`} className="shrink-0 rounded-lg p-2 text-indigo-400 transition hover:bg-indigo-500/10 hover:text-indigo-300 disabled:cursor-not-allowed disabled:opacity-40">
                                  <UserPlus size={19} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {currentTeamSize >= maxSize && <p className="rounded-xl border border-yellow-500/20 bg-yellow-500/[0.05] p-4 text-sm text-yellow-400">Your team has reached the maximum allowed size.</p>}

                {/* Validation */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    {teamNameValid ? (
                      <>
                        <Check size={17} className="text-green-400" />
                        <span className="text-green-400">Team name is valid.</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={17} className="text-yellow-400" />
                        <span className="text-yellow-400">Enter a team name of at least 3 characters.</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    {teamSizeValid ? (
                      <>
                        <Check size={17} className="text-green-400" />
                        <span className="text-green-400">Team size requirement satisfied.</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={17} className="text-yellow-400" />
                        <span className="text-yellow-400">
                          Add {Math.max(0, minSize - currentTeamSize)} more
                          {Math.max(0, minSize - currentTeamSize) === 1 ? " member" : " members"} to meet the minimum team size.
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Payment Error */}
                {paymentError && <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] p-4 text-sm text-red-400">{paymentError}</div>}

                {/* Payment Button */}
                <button type="button" onClick={handlePayment} disabled={!canProceedToPayment || paymentLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 text-sm font-semibold transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400">
                  {paymentLoading ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" />
                      Preparing Payment...
                    </>
                  ) : (
                    <>
                      <IndianRupee size={18} />
                      Continue to Payment
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-gray-500">Your team will only be registered after successful payment verification.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Success Popup */}
      {paymentSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="payment-success-title" className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111318] p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <Check size={32} className="text-green-400" />
            </div>

            <h2 id="payment-success-title" className="mt-6 text-2xl font-bold text-white">
              Registration Successful!
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-400">Your payment has been verified and your team has been successfully registered. Your tickets and confirmation details are on their way!</p>

            <button type="button" onClick={() => navigate("/profile")} className="mt-7 w-full rounded-xl bg-indigo-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-indigo-500">
              Go to Profile
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

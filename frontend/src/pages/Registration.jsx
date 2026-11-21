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

  const [step, setStep] = useState("event");
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
    if (step !== "team" || searchQuery.trim().length < 2) {
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
  }, [searchQuery, step, eventId, selectedMembers]);

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
          color: "#3B82D6",
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
      <main className="registration-editorial starfield flex min-h-screen items-center justify-center bg-[#00001F] px-5 text-[#E8E5DF]">
        <div className="flex items-center gap-3 text-[#AEBBD0]">
          <LoaderCircle className="animate-spin" size={22} />
          Loading event details...
        </div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="registration-editorial starfield flex min-h-screen items-center justify-center bg-[#00001F] px-5 text-[#E8E5DF]">
        <div className="w-full max-w-md rounded-none border border-[#3B82D6]/20 bg-[#080D24] p-8 text-center">
          <AlertCircle className="mx-auto mb-4 text-red-400" size={36} />

          <h1 className="text-xl font-semibold">Unable to continue</h1>

          <p className="mt-3 text-sm leading-relaxed text-[#AEBBD0]">{error || "Event not found."}</p>

          {!localStorage.getItem("authToken") && (
            <Link to="/auth" className="mt-6 inline-block rounded-none bg-[#1E4F9A] px-5 py-3 text-sm font-medium hover:bg-[#3B82D6]">
              Log In
            </Link>
          )}

          <div>
            <Link to="/" className="mt-6 inline-flex items-center gap-2 text-sm text-[#AEBBD0] hover:text-[#E8E5DF]">
              <ArrowLeft size={16} />
              Back to Home
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
    <main className="registration-editorial starfield min-h-screen bg-[#00001F] px-5 py-8 font-editorial text-[#E8E5DF] sm:px-8 sm:py-12">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap');
        .registration-editorial {
          font-family: "Playfair Display", "Iowan Old Style", Baskerville, Georgia, serif;
          background-image:
            radial-gradient(1px 1px at 8% 18%, rgba(232,229,223,.75) 50%, transparent 100%),
            radial-gradient(1px 1px at 24% 72%, rgba(174,187,208,.6) 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 48% 28%, rgba(232,229,223,.65) 50%, transparent 100%),
            radial-gradient(1px 1px at 71% 82%, rgba(111,145,216,.8) 50%, transparent 100%),
            radial-gradient(1px 1px at 88% 34%, rgba(232,229,223,.7) 50%, transparent 100%);
          background-size: 420px 360px;
          --nexus-ink: #00001F;
          --nexus-panel: #080D24;
          --nexus-paper: #E8E5DF;
          --nexus-muted: #AEBBD0;
          --nexus-blue: #3B82D6;
          --nexus-line: rgba(111,145,216,.28);
          isolation: isolate;
        }
        .registration-editorial h1,
        .registration-editorial h2,
        .registration-editorial h3 {
          font-family: "Playfair Display", "Iowan Old Style", Baskerville, Georgia, serif;
          font-weight: 500;
        }
        .registration-editorial [class*="border-[#3B82D6]"] {
          border-color: var(--nexus-line);
        }
        .registration-editorial input {
          border-radius: 0 !important;
          background: rgba(0,0,31,.38) !important;
          color: var(--nexus-paper) !important;
          border-color: var(--nexus-line) !important;
        }
        .registration-editorial input::placeholder { color: #8B929F !important; }
        .registration-editorial input:focus-visible,
        .registration-editorial button:focus-visible,
        .registration-editorial a:focus-visible {
          outline: 2px solid #6F91D8;
          outline-offset: 4px;
        }
        .registration-editorial button { border-radius: 0 !important; }
        .registration-editorial .registration-panel {
          background-image: linear-gradient(135deg, rgba(59,130,214,.07), transparent 55%);
        }
        @media (max-width: 640px) {
          .registration-editorial h1 { line-height: 1.08; }
        }
      `}</style>

      <div className="mx-auto max-w-3xl space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#AEBBD0] transition hover:text-[#E8E5DF]">
          <ArrowLeft size={17} />
          Back to Home
        </Link>

        <header className="border-b border-[#3B82D6]/20 pb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#3B82D6]">✦ &nbsp; AI NEXUS · ACROPOLIS</p>
          <h1 className="mt-4 text-4xl font-medium tracking-tight text-[#E8E5DF] sm:text-5xl">
            Event <span className="text-[#6F91D8]">Registration.</span>
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#AEBBD0] sm:text-base">Review the event details and bring your team together.</p>
        </header>

        <div className="overflow-hidden border border-[#3B82D6]/20 bg-[#080D24]/80 shadow-[0_24px_80px_rgba(0,0,0,.18)]">
          {thumbnail && (
            <div className="aspect-video w-full overflow-hidden bg-[#18213A]">
              <img src={thumbnail} alt={event.eventName} className="h-full w-full object-cover" />
            </div>
          )}

          <div className="registration-panel space-y-7 p-6 sm:p-8">
            {/* Three-step progress indicator, matching the admin verification flow */}
            <div className="flex items-center gap-3">
              {[
                { id: "event", label: "Event", number: "01" },
                { id: "team", label: "Team", number: "02" },
                { id: "payment", label: "Payment", number: "03" },
              ].map((item, index) => {
                const steps = ["event", "team", "payment"];
                const activeIndex = steps.indexOf(step);
                const completed = index < activeIndex;
                const active = item.id === step;

                return (
                  <div key={item.id} className="flex min-w-0 flex-1 items-center gap-2">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center border text-[10px] font-semibold tracking-wide ${active ? "border-[#3B82D6] bg-[#1E4F9A] text-[#E8E5DF]" : completed ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300" : "border-[#3B82D6]/25 text-[#8B929F]"}`}>{completed ? <Check size={15} /> : item.number}</div>
                    <span className={`truncate text-xs uppercase tracking-[0.12em] ${active ? "text-[#E8E5DF]" : completed ? "text-emerald-300" : "text-[#8B929F]"}`}>{item.label}</span>
                    {index < 2 && <div className={`h-px min-w-3 flex-1 ${completed ? "bg-emerald-400/50" : "bg-[#3B82D6]/20"}`} />}
                  </div>
                );
              })}
            </div>

            {step === "event" && (
              <section className="space-y-7">
                <div>
                  <div className="mb-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${registrationOpen ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{registrationOpen ? "Registration Open" : "Registration Closed"}</span>
                  </div>

                  <h2 className="text-2xl font-bold sm:text-3xl">{event.eventName}</h2>

                  <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#AEBBD0]">{event.description || "No description available."}</p>
                </div>

                {/* Event Details */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-none border border-[#3B82D6]/20 bg-[#080D24] p-4">
                    <CalendarDays className="shrink-0 text-[#3B82D6]" size={22} />
                    <div>
                      <p className="text-xs text-[#8B929F]">Event Date</p>
                      <p className="mt-1 text-sm font-medium">{formatDate(event.eventDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-none border border-[#3B82D6]/20 bg-[#080D24] p-4">
                    <IndianRupee className="shrink-0 text-[#3B82D6]" size={22} />
                    <div>
                      <p className="text-xs text-[#8B929F]">Registration Fee</p>
                      <p className="mt-1 text-sm font-medium">{event.registrationFee > 0 ? `₹${event.registrationFee}` : "Free"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-none border border-[#3B82D6]/20 bg-[#080D24] p-4">
                    <Building2 className="shrink-0 text-[#3B82D6]" size={22} />
                    <div>
                      <p className="text-xs text-[#8B929F]">Eligibility</p>
                      <p className="mt-1 text-sm font-medium">{event.collegeOnly ? "Acropolis Students Only" : "Open to All"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-none border border-[#3B82D6]/20 bg-[#080D24] p-4">
                    <Users className="shrink-0 text-[#3B82D6]" size={22} />
                    <div>
                      <p className="text-xs text-[#8B929F]">Registration Status</p>
                      <p className="mt-1 text-sm font-medium">{event.registrationStatus}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-none border border-[#3B82D6]/20 bg-[#080D24] p-4">
                    <UserPlus className="shrink-0 text-[#3B82D6]" size={22} />
                    <div>
                      <p className="text-xs text-[#8B929F]">Team Size</p>
                      <p className="mt-1 text-sm font-medium">{teamSize}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#3B82D6]/20 pt-6">
                  <button type="button" disabled={!registrationOpen} onClick={() => setStep("team")} className="w-full bg-[#1E4F9A] px-6 py-4 text-sm font-semibold transition hover:bg-[#3B82D6] disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-[#AEBBD0]">
                    {registrationOpen ? "Continue to Team Formation" : "Registration Closed"}
                    <ArrowLeft className="ml-2 inline rotate-180" size={16} />
                  </button>
                  <p className="mt-3 text-center text-xs text-[#8B929F]">Next: create your team and add participants.</p>
                </div>
              </section>
            )}

            {step === "team" && (
              <section className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3B82D6]">STEP 02 · TEAM DETAILS</p>
                  <h2 className="mt-2 text-2xl font-medium text-[#E8E5DF]">Build your team.</h2>
                  <p className="mt-2 text-sm leading-7 text-[#AEBBD0]">Choose a team name and add existing AI Nexus users.</p>
                </div>

                {/* Team Name */}
                <div>
                  <label htmlFor="teamName" className="mb-3 block text-sm font-medium text-[#AEBBD0]">
                    Team Name
                  </label>

                  <input id="teamName" type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} maxLength={120} placeholder="Enter your team name..." className="w-full rounded-none border border-[#3B82D6]/20 bg-[#00001F] px-4 py-4 text-sm text-[#E8E5DF] outline-none transition placeholder:text-[#8B929F] focus:border-[#3B82D6]" />

                  <div className="mt-2 flex justify-between text-xs">
                    <span className="text-[#8B929F]">Minimum 3 characters.</span>
                    <span className="text-[#8B929F]">{teamName.length}/120</span>
                  </div>
                </div>

                {/* Team Size */}
                <div className="flex items-center justify-between rounded-none border border-[#3B82D6]/20 bg-[#3B82D6]/[0.06] p-4">
                  <div>
                    <p className="text-sm font-medium">Team Members</p>
                    <p className="mt-1 text-xs text-[#AEBBD0]">
                      Minimum {minSize} · Maximum {maxSize}
                    </p>
                  </div>

                  <p className="text-xl font-bold text-[#3B82D6]">
                    {currentTeamSize}/{maxSize ?? "—"}
                  </p>
                </div>

                {/* Team Leader */}
                <div>
                  <p className="mb-3 text-sm font-medium text-[#AEBBD0]">Your Team</p>

                  <div className="flex items-center gap-3 rounded-none border border-[#3B82D6]/30 bg-[#3B82D6]/[0.06] p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3B82D6]/20">
                      <Crown className="text-[#3B82D6]" size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">You</p>
                      <p className="text-xs text-[#3B82D6]">Team Leader</p>
                    </div>

                    <span className="rounded-full bg-[#3B82D6]/10 px-3 py-1 text-xs text-[#6F91D8]">Leader</span>
                  </div>
                </div>

                {/* Selected Teammates */}
                {selectedMembers.length > 0 && (
                  <div className="space-y-3">
                    {selectedMembers.map((member) => (
                      <div key={member.userId} className="flex items-center gap-3 rounded-none border border-[#3B82D6]/20 bg-[#080D24] p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3B82D6]/10 text-sm font-semibold">{member.name?.charAt(0)?.toUpperCase()}</div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{member.name}</p>
                          <p className="truncate text-xs text-[#8B929F]">{member.email}</p>
                        </div>

                        <button type="button" onClick={() => removeMember(member.userId)} className="rounded-none p-2 text-[#8B929F] transition hover:bg-red-500/10 hover:text-red-400" aria-label={`Remove ${member.name}`}>
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search Teammates */}
                {currentTeamSize < maxSize && (
                  <div>
                    <label className="mb-3 block text-sm font-medium text-[#AEBBD0]">Add Teammates</label>

                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B929F]" size={18} />

                      <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name or email..." className="w-full rounded-none border border-[#3B82D6]/20 bg-[#00001F] py-4 pl-12 pr-4 text-sm text-[#E8E5DF] outline-none transition placeholder:text-[#8B929F] focus:border-[#3B82D6]" />

                      {searchLoading && <LoaderCircle className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#3B82D6]" size={18} />}
                    </div>

                    <p className="mt-2 text-xs text-[#8B929F]">Enter at least 2 characters to search.</p>

                    {searchError && <p className="mt-3 text-sm text-red-400">{searchError}</p>}

                    {searchQuery.trim().length >= 2 && !searchLoading && !searchError && searchResults.length === 0 && <p className="mt-4 text-center text-sm text-[#8B929F]">No matching users found.</p>}

                    {searchResults.length > 0 && (
                      <div className="mt-3 overflow-hidden rounded-none border border-[#3B82D6]/20">
                        {searchResults.map((user) => {
                          const alreadyRegistered = user.alreadyRegistered === true;

                          return (
                            <div key={user.userId} className={`flex w-full items-center gap-3 border-b border-[#3B82D6]/10 p-4 last:border-b-0 ${alreadyRegistered ? "bg-[#080D24] opacity-60" : "transition hover:bg-[#3B82D6]/[0.06]"}`}>
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3B82D6]/10 text-sm font-semibold text-[#3B82D6]">{user.name?.charAt(0)?.toUpperCase()}</div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{user.name}</p>
                                <p className="truncate text-xs text-[#8B929F]">{user.email}</p>
                              </div>

                              {alreadyRegistered ? (
                                <span className="shrink-0 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400">Registered</span>
                              ) : (
                                <button type="button" onClick={() => addMember(user)} disabled={alreadyRegistered} aria-label={`Add ${user.name}`} className="shrink-0 rounded-none p-2 text-[#3B82D6] transition hover:bg-[#3B82D6]/10 hover:text-[#6F91D8] disabled:cursor-not-allowed disabled:opacity-40">
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

                {currentTeamSize >= maxSize && <p className="rounded-none border border-yellow-500/20 bg-yellow-500/[0.05] p-4 text-sm text-yellow-400">Your team has reached the maximum allowed size.</p>}

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

                <div className="flex flex-col-reverse gap-3 border-t border-[#3B82D6]/20 pt-6 sm:flex-row">
                  <button type="button" onClick={() => setStep("event")} className="flex-1 border border-[#3B82D6]/30 px-6 py-4 text-sm font-semibold text-[#AEBBD0] transition hover:border-[#3B82D6] hover:text-[#E8E5DF]">
                    Back to Event
                  </button>
                  <button type="button" onClick={() => setStep("payment")} disabled={!canProceedToPayment} className="flex-1 bg-[#1E4F9A] px-6 py-4 text-sm font-semibold text-[#E8E5DF] transition hover:bg-[#3B82D6] disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-[#AEBBD0]">
                    Review & Continue
                    <ArrowLeft className="ml-2 inline rotate-180" size={16} />
                  </button>
                </div>
              </section>
            )}

            {step === "payment" && (
              <section className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3B82D6]">STEP 03 · FINAL REVIEW</p>
                  <h2 className="mt-2 text-2xl font-medium text-[#E8E5DF]">Review your registration.</h2>
                  <p className="mt-2 text-sm leading-7 text-[#AEBBD0]">Make sure your event and team details are correct before proceeding to secure payment.</p>
                </div>

                <div className="border border-[#3B82D6]/20 bg-[#00001F]/50 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8B929F]">Selected event</p>
                  <h3 className="mt-2 text-xl text-[#E8E5DF]">{event.eventName}</h3>
                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-[#8B929F]">Event date</p>
                      <p className="mt-1 text-[#E8E5DF]">{formatDate(event.eventDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8B929F]">Registration fee</p>
                      <p className="mt-1 text-[#E8E5DF]">{event.registrationFee > 0 ? `₹${event.registrationFee}` : "Free"}</p>
                    </div>
                  </div>
                </div>

                <div className="border border-[#3B82D6]/20 bg-[#00001F]/50 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[#8B929F]">Team name</p>
                      <p className="mt-1 text-lg text-[#E8E5DF]">{teamName.trim()}</p>
                    </div>
                    <p className="text-sm text-[#6F91D8]">
                      {currentTeamSize} / {maxSize} members
                    </p>
                  </div>
                  <div className="mt-4 space-y-3 border-t border-[#3B82D6]/15 pt-4">
                    <div className="flex items-center gap-3 text-sm">
                      <Crown size={16} className="text-[#6F91D8]" />
                      <span className="text-[#E8E5DF]">
                        You <span className="text-[#8B929F]">· Team Leader</span>
                      </span>
                    </div>
                    {selectedMembers.map((member) => (
                      <div key={member.userId} className="flex items-center gap-3 text-sm">
                        <Users size={16} className="text-[#6F91D8]" />
                        <span className="text-[#E8E5DF]">{member.name}</span>
                        <span className="truncate text-xs text-[#8B929F]">{member.email}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between border border-[#3B82D6]/25 bg-[#3B82D6]/[0.06] p-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#8B929F]">Amount payable</p>
                    <p className="mt-1 text-xs text-[#AEBBD0]">Secure checkout powered by Razorpay</p>
                  </div>
                  <p className="text-2xl font-medium text-[#E8E5DF]">{event.registrationFee > 0 ? `₹${event.registrationFee}` : "Free"}</p>
                </div>

                {paymentError && (
                  <div role="alert" className="border border-red-500/20 bg-red-500/[0.05] p-4 text-sm text-red-300">
                    {paymentError}
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 border-t border-[#3B82D6]/20 pt-6 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentError("");
                      setStep("team");
                    }}
                    disabled={paymentLoading}
                    className="flex-1 border border-[#3B82D6]/30 px-6 py-4 text-sm font-semibold text-[#AEBBD0] transition hover:border-[#3B82D6] hover:text-[#E8E5DF] disabled:opacity-50">
                    Edit Team
                  </button>
                  <button type="button" onClick={handlePayment} disabled={!canProceedToPayment || paymentLoading} className="flex-1 inline-flex items-center justify-center gap-2 bg-[#1E4F9A] px-6 py-4 text-sm font-semibold text-[#E8E5DF] transition hover:bg-[#3B82D6] disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-[#AEBBD0]">
                    {paymentLoading ? (
                      <>
                        <LoaderCircle size={18} className="animate-spin" />
                        Preparing Payment...
                      </>
                    ) : (
                      <>
                        <IndianRupee size={18} />
                        Pay & Complete Registration
                      </>
                    )}
                  </button>
                </div>
                <p className="text-center text-xs text-[#8B929F]">Your team will only be registered after successful payment verification.</p>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Payment Success Popup */}
      {paymentSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="payment-success-title" className="w-full max-w-md rounded-none border border-[#3B82D6]/20 bg-[#080D24] p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <Check size={32} className="text-green-400" />
            </div>

            <h2 id="payment-success-title" className="mt-6 text-2xl font-bold text-[#E8E5DF]">
              Registration Successful!
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#AEBBD0]">Your payment has been verified and your team has been successfully registered. Your tickets and confirmation details are on their way!</p>

            <button type="button" onClick={() => navigate("/profile")} className="mt-7 w-full rounded-none bg-[#1E4F9A] px-6 py-4 text-sm font-semibold text-[#E8E5DF] transition hover:bg-[#3B82D6]">
              Go to Profile
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

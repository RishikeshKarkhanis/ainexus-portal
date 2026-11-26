import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { ArrowLeft, CalendarDays, IndianRupee, Building2, Users, UserPlus, AlertCircle, LoaderCircle, Search, X, Check, Crown, UploadCloud, FileImage } from "lucide-react";

import { apiRequest } from "../lib/api";

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
  const [leaderPhoneNumber, setLeaderPhoneNumber] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [registrationId, setRegistrationId] = useState("");
  const [screenshotInputKey, setScreenshotInputKey] = useState(0);

  useEffect(() => {
    if (!paymentScreenshot) {
      setScreenshotPreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(paymentScreenshot);
    setScreenshotPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [paymentScreenshot]);

  const handleScreenshotChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setPaymentError("Please upload a JPG, PNG or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPaymentError("Screenshot must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setPaymentError("");
    setPaymentScreenshot(file);
  };

  const removePaymentScreenshot = () => {
    setPaymentScreenshot(null);
    setScreenshotInputKey((key) => key + 1);
  };

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
    if (step !== "members" || searchQuery.trim().length < 2) {
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
    const isAcropolisEmail = user.email?.trim().toLowerCase().endsWith("@acropolis.in");

    if (user.alreadyRegistered || (event?.collegeOnly && !isAcropolisEmail)) return;

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

  // Submit the registration first, then upload its payment screenshot.
  // If the upload fails, retain registrationId so retrying does not create a duplicate.
  const handlePayment = async () => {
    if (!canProceedToPayment || paymentLoading) return;

    const isFreeEvent = Number(event?.registrationFee ?? 0) <= 0;
    const utr = transactionId.trim();

    if (!isFreeEvent && (utr.length < 3 || utr.length > 100)) {
      setPaymentError("Please enter a valid UPI transaction ID.");
      return;
    }

    if (!isFreeEvent && !paymentScreenshot) {
      setPaymentError("Please upload your payment screenshot.");
      return;
    }

    try {
      setPaymentLoading(true);
      setPaymentError("");

      const payload = {
        eventId,
        teamName: teamName.trim(),
        memberIds: selectedMembers.map((member) => member.userId),
        leaderPhoneNumber: leaderPhoneNumber.trim(),
      };

      if (isFreeEvent) {
        await apiRequest("/api/payments/free-registration", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        let activeRegistrationId = registrationId;

        if (!activeRegistrationId) {
          const registrationResponse = await apiRequest("/api/payments/manual", {
            method: "POST",
            body: JSON.stringify({
              ...payload,
              transactionId: utr,
            }),
          });

          activeRegistrationId = registrationResponse?.registrationId;

          if (!activeRegistrationId) {
            throw new Error("Registration was submitted, but the server did not return its registration ID. Please contact the AI Nexus Club team before retrying.");
          }

          setRegistrationId(activeRegistrationId);
        }

        const formData = new FormData();
        formData.append("file", paymentScreenshot);

        await apiRequest(`/api/payments/${activeRegistrationId}/screenshot`, {
          method: "POST",
          body: formData,
        });
      }

      setPaymentSuccess(true);
    } catch (err) {
      setPaymentError(err.message || (isFreeEvent ? "Unable to complete your registration. Please try again." : "Unable to submit your payment details and screenshot. Please try again."));
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

  const registrationOpen = event.registrationStatus === "OPEN";

  const minSize = event.minTeamSize;
  const maxSize = event.maxTeamSize;

  const teamSize = minSize != null && maxSize != null ? `${minSize} – ${maxSize} members` : "Not configured";

  const currentTeamSize = selectedMembers.length + 1;

  const teamSizeValid = minSize != null && maxSize != null && currentTeamSize >= minSize && currentTeamSize <= maxSize;

  const teamNameValid = teamName.trim().length >= 3 && teamName.trim().length <= 120;
  const phoneValid = /^(?:\+91[- ]?)?[6-9]\d{9}$/.test(leaderPhoneNumber.trim());

  const canProceedToPayment = registrationOpen && teamSizeValid && teamNameValid && phoneValid;

  return (
    <main className="registration-editorial starfield flex min-h-screen items-center justify-center bg-[#00001F] px-3 py-3 font-editorial text-[#E8E5DF] sm:px-6 sm:py-4">
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

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#AEBBD0] transition hover:text-[#E8E5DF]">
          <ArrowLeft size={17} />
          Back to Home
        </Link>

        <header className="flex items-center justify-between gap-4 border-b border-[#3B82D6]/20 pb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#3B82D6]">AI NEXUS CLUB · ACROPOLIS</p>
          <div>
            <h1 className="mt-1 text-2xl font-medium tracking-tight text-[#E8E5DF] sm:text-3xl">
              Event <span className="text-[#6F91D8]">Registration.</span>
            </h1>
            <p className="mt-1 text-xs text-[#AEBBD0] sm:text-sm">A quick, guided registration experience.</p>
          </div>
        </header>

        <div className="overflow-hidden border border-[#3B82D6]/20 bg-[#080D24]/80 shadow-[0_24px_80px_rgba(0,0,0,.18)]">
          <div className="registration-panel space-y-4 p-4 sm:p-6">
            {/* Three-step progress indicator, matching the admin verification flow */}
            <div className="flex items-center gap-3">
              {[{ id: "event", label: "Event", number: "01" }, { id: "team", label: "Team", number: "02" }, { id: "members", label: "Members", number: "03" }, { id: "payment", label: "Pay", number: "04" }, ...(Number(event?.registrationFee ?? 0) > 0 ? [{ id: "proof", label: "Proof", number: "05" }] : [])].map((item, index, items) => {
                const steps = items.map((stepItem) => stepItem.id);
                const activeIndex = steps.indexOf(step);
                const completed = index < activeIndex;
                const active = item.id === step;

                return (
                  <div key={item.id} className="flex min-w-0 flex-1 items-center gap-1.5">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center border text-[10px] font-semibold ${active ? "border-[#3B82D6] bg-[#1E4F9A] text-[#E8E5DF]" : completed ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300" : "border-[#3B82D6]/25 text-[#8B929F]"}`}>{completed ? <Check size={14} /> : item.number}</div>
                    <span className={`truncate text-[10px] uppercase tracking-[0.08em] sm:text-xs ${active ? "text-[#E8E5DF]" : completed ? "text-emerald-300" : "text-[#8B929F]"}`}>{item.label}</span>
                    {index < items.length - 1 && <div className={`h-px min-w-2 flex-1 ${completed ? "bg-emerald-400/50" : "bg-[#3B82D6]/20"}`} />}
                  </div>
                );
              })}
            </div>

            {step === "event" && (
              <section className="space-y-4">
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
              <section className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3B82D6]">STEP 02 · TEAM DETAILS</p>
                  <h2 className="mt-1 text-2xl font-medium text-[#E8E5DF]">Set up your team.</h2>
                  <p className="mt-1 text-sm text-[#AEBBD0]">Choose a team name and contact number.</p>
                </div>
                <div>
                  <label htmlFor="teamName" className="mb-2 block text-sm font-medium text-[#AEBBD0]">
                    Team Name
                  </label>
                  <input id="teamName" type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} maxLength={120} placeholder="Enter your team name..." className="w-full border border-[#3B82D6]/20 bg-[#00001F] px-4 py-3 text-sm text-[#E8E5DF] outline-none transition placeholder:text-[#8B929F] focus:border-[#3B82D6]" />
                  <div className="mt-1 flex justify-between text-xs">
                    <span className="text-[#8B929F]">Minimum 3 characters.</span>
                    <span className="text-[#8B929F]">{teamName.length}/120</span>
                  </div>
                </div>
                <div>
                  <label htmlFor="leaderPhoneNumber" className="mb-2 block text-sm font-medium text-[#AEBBD0]">
                    Team Leader's Phone Number
                  </label>
                  <input id="leaderPhoneNumber" type="tel" inputMode="tel" autoComplete="tel" value={leaderPhoneNumber} onChange={(e) => setLeaderPhoneNumber(e.target.value.replace(/[^\d+\s-]/g, ""))} maxLength={15} placeholder="Enter your 10-digit mobile number" className="w-full border border-[#3B82D6]/20 bg-[#00001F] px-4 py-3 text-sm text-[#E8E5DF] outline-none transition placeholder:text-[#8B929F] focus:border-[#3B82D6]" />
                  <p className="mt-1 text-xs text-[#8B929F]">Used for event-related communication.</p>
                  {leaderPhoneNumber.length > 0 && !phoneValid && <p className="mt-1 text-xs text-red-400">Please enter a valid Indian mobile number.</p>}
                </div>
                <div className="flex items-center justify-between border border-[#3B82D6]/20 bg-[#3B82D6]/[0.06] p-3">
                  <div>
                    <p className="text-sm font-medium">Team size</p>
                    <p className="text-xs text-[#AEBBD0]">
                      Minimum {minSize} · Maximum {maxSize}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-[#3B82D6]">
                    {currentTeamSize}/{maxSize ?? "—"}
                  </p>
                </div>
                <div className="flex flex-col-reverse gap-3 border-t border-[#3B82D6]/20 pt-4 sm:flex-row">
                  <button type="button" onClick={() => setStep("event")} className="flex-1 border border-[#3B82D6]/30 px-5 py-3 text-sm font-semibold text-[#AEBBD0]">
                    Back
                  </button>
                  <button type="button" onClick={() => setStep("members")} disabled={!teamNameValid || !phoneValid} className="flex-1 bg-[#1E4F9A] px-5 py-3 text-sm font-semibold text-[#E8E5DF] disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-[#AEBBD0]">
                    Continue to Members <ArrowLeft className="ml-2 inline rotate-180" size={16} />
                  </button>
                </div>
              </section>
            )}

            {step === "members" && (
              <section className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3B82D6]">STEP 03 · TEAM MEMBERS</p>
                  <h2 className="mt-1 text-2xl font-medium text-[#E8E5DF]">Bring your team together.</h2>
                  <p className="mt-1 text-sm text-[#AEBBD0]">Add teammates and meet the team-size requirement.</p>
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
                      <div className="mt-3 max-h-48 overflow-y-auto rounded-none border border-[#3B82D6]/20">
                        {searchResults.map((user) => {
                          const alreadyRegistered = user.alreadyRegistered === true;
                          const isAcropolisEmail = user.email?.trim().toLowerCase().endsWith("@acropolis.in");
                          const isIneligible = event?.collegeOnly === true && !isAcropolisEmail;
                          const isDisabled = alreadyRegistered || isIneligible;

                          return (
                            <div key={user.userId} className={`flex w-full items-center gap-3 border-b border-[#3B82D6]/10 p-4 last:border-b-0 ${isDisabled ? "bg-[#080D24] opacity-60" : "transition hover:bg-[#3B82D6]/[0.06]"}`}>
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3B82D6]/10 text-sm font-semibold text-[#3B82D6]">{user.name?.charAt(0)?.toUpperCase()}</div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{user.name}</p>
                                <p className="truncate text-xs text-[#8B929F]">{user.email}</p>
                              </div>

                              {alreadyRegistered ? (
                                <span className="shrink-0 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400">Registered</span>
                              ) : isIneligible ? (
                                <span className="shrink-0 rounded-full bg-yellow-500/10 px-3 py-1.5 text-xs font-semibold text-yellow-400" title="Acropolis-only events require an @acropolis.in email address">
                                  Acropolis email required
                                </span>
                              ) : (
                                <button type="button" onClick={() => addMember(user)} disabled={isDisabled} aria-label={`Add ${user.name}`} className="shrink-0 rounded-none p-2 text-[#3B82D6] transition hover:bg-[#3B82D6]/10 hover:text-[#6F91D8] disabled:cursor-not-allowed disabled:opacity-40">
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

                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className={teamSizeValid ? "text-green-400" : "text-yellow-400"}>{teamSizeValid ? "Team size requirement satisfied." : `Add ${Math.max(0, minSize - currentTeamSize)} more member(s).`}</span>
                  <span className="text-[#6F91D8]">
                    {currentTeamSize}/{maxSize} members
                  </span>
                </div>
                <div className="flex flex-col-reverse gap-3 border-t border-[#3B82D6]/20 pt-4 sm:flex-row">
                  <button type="button" onClick={() => setStep("team")} className="flex-1 border border-[#3B82D6]/30 px-5 py-3 text-sm font-semibold text-[#AEBBD0]">
                    Back to Team
                  </button>
                  <button type="button" onClick={() => setStep("payment")} disabled={!teamSizeValid} className="flex-1 bg-[#1E4F9A] px-5 py-3 text-sm font-semibold text-[#E8E5DF] disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-[#AEBBD0]">
                    Continue <ArrowLeft className="ml-2 inline rotate-180" size={16} />
                  </button>
                </div>
              </section>
            )}

            {step === "payment" && (
              <section className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3B82D6]">STEP 04 · PAYMENT</p>
                  <h2 className="mt-2 text-2xl font-medium text-[#E8E5DF]">Make your payment.</h2>
                  <p className="mt-2 text-sm leading-7 text-[#AEBBD0]">{Number(event.registrationFee ?? 0) > 0 ? "Make sure your event and team details are correct before proceeding to payment." : "Review your event and team details before completing your free registration."}</p>
                </div>

                <div className="space-y-5">
                  {/* Amount */}
                  <div className="flex items-center justify-between border border-[#3B82D6]/25 bg-[#3B82D6]/[0.06] p-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[#8B929F]">Amount payable</p>
                      <p className="mt-1 text-xs text-[#AEBBD0]">{Number(event.registrationFee ?? 0) > 0 ? "Pay using the official college UPI QR" : "No payment is required for this event."}</p>
                    </div>

                    <p className="text-2xl font-medium text-[#E8E5DF]">{event.registrationFee > 0 ? `₹${event.registrationFee}` : "Free"}</p>
                  </div>

                  {/* UPI QR */}
                  {event.registrationFee > 0 && (
                    <div className="border border-[#3B82D6]/20 bg-[#00001F]/50 p-3 text-center">
                      <p className="text-sm font-semibold text-[#E8E5DF]">Scan & Pay</p>

                      <p className="mt-2 text-xs text-[#AEBBD0]">Scan this QR code using any UPI application.</p>

                      <div className="mx-auto mt-3 flex w-fit items-center justify-center bg-white p-2">
                        <img src="/qr/qr.png" alt="Official College UPI QR Code" className="h-40 w-40 object-contain" />
                      </div>

                      <p className="mt-4 text-sm font-semibold text-[#E8E5DF]">Pay exactly ₹{event.registrationFee}</p>

                      <p className="mt-2 text-xs leading-6 text-[#AEBBD0]">After completing your payment, enter the UPI transaction ID below. Your registration will be confirmed only after verification by the AI Nexus admin team.</p>
                    </div>
                  )}

                  {event.registrationFee > 0 && (
                    <div className="flex flex-col-reverse gap-3 border-t border-[#3B82D6]/20 pt-4 sm:flex-row">
                      <button type="button" onClick={() => setStep("members")} className="flex-1 border border-[#3B82D6]/30 px-5 py-3 text-sm font-semibold text-[#AEBBD0]">
                        Back to Members
                      </button>
                      <button type="button" onClick={() => setStep("proof")} className="flex-1 bg-[#1E4F9A] px-5 py-3 text-sm font-semibold text-[#E8E5DF]">
                        Continue to Proof <ArrowLeft className="ml-2 inline rotate-180" size={16} />
                      </button>
                    </div>
                  )}
                  {Number(event.registrationFee ?? 0) <= 0 && (
                    <div className="flex flex-col-reverse gap-3 border-t border-[#3B82D6]/20 pt-4 sm:flex-row">
                      <button type="button" onClick={() => setStep("members")} className="flex-1 border border-[#3B82D6]/30 px-5 py-3 text-sm font-semibold text-[#AEBBD0]">
                        Back to Members
                      </button>
                      <button type="button" onClick={handlePayment} disabled={!canProceedToPayment || paymentLoading} className="flex-1 bg-[#1E4F9A] px-5 py-3 text-sm font-semibold text-[#E8E5DF] disabled:opacity-50">
                        {paymentLoading ? "Submitting..." : "Complete Free Registration"}
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}

            {step === "proof" && (
              <section className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3B82D6]">STEP 05 · PAYMENT PROOF</p>
                  <h2 className="mt-1 text-2xl font-medium text-[#E8E5DF]">Confirm your payment.</h2>
                  <p className="mt-1 text-sm text-[#AEBBD0]">Enter your UTR and upload the payment screenshot.</p>
                </div>
                {event.registrationFee > 0 && (
                  <div>
                    <label htmlFor="transactionId" className="mb-3 block text-sm font-medium text-[#AEBBD0]">
                      UPI Transaction ID / UTR
                    </label>

                    <input id="transactionId" type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} maxLength={100} placeholder="Enter your UPI transaction ID" autoComplete="off" className="w-full border border-[#3B82D6]/20 bg-[#00001F] px-4 py-4 text-sm text-[#E8E5DF] outline-none transition placeholder:text-[#8B929F] focus:border-[#3B82D6]" />

                    <p className="mt-2 text-xs leading-5 text-[#8B929F]">You can find this ID in your UPI app's payment history. Please double-check it before submitting.</p>

                    <div className="mt-5">
                      <label className="mb-3 block text-sm font-medium text-[#AEBBD0]">
                        Payment Screenshot <span className="text-red-400">*</span>
                      </label>

                      <input key={screenshotInputKey} id="paymentScreenshot" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleScreenshotChange} className="sr-only" />

                      {!paymentScreenshot ? (
                        <label htmlFor="paymentScreenshot" className="flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-[#3B82D6]/40 bg-[#3B82D6]/[0.04] px-5 py-7 text-center transition hover:border-[#3B82D6] hover:bg-[#3B82D6]/[0.08]">
                          <UploadCloud size={25} className="text-[#6F91D8]" />
                          <span className="text-sm font-semibold text-[#E8E5DF]">Upload payment screenshot</span>
                          <span className="text-xs text-[#8B929F]">JPG, PNG or WEBP · Maximum 5 MB</span>
                        </label>
                      ) : (
                        <div className="border border-[#3B82D6]/25 bg-[#00001F]/50 p-4">
                          <div className="flex items-center gap-3">
                            <FileImage size={22} className="shrink-0 text-[#6F91D8]" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-[#E8E5DF]">{paymentScreenshot.name}</p>
                              <p className="mt-1 text-xs text-[#8B929F]">{(paymentScreenshot.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>
                            <button type="button" onClick={removePaymentScreenshot} disabled={paymentLoading} className="p-2 text-[#8B929F] transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50" aria-label="Remove payment screenshot">
                              <X size={18} />
                            </button>
                          </div>

                          {screenshotPreview && <img src={screenshotPreview} alt="Payment screenshot preview" className="mt-4 max-h-64 w-full border border-[#3B82D6]/15 object-contain" />}

                          <label htmlFor="paymentScreenshot" className="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#6F91D8] hover:text-[#AEBBD0]">
                            <UploadCloud size={15} />
                            Replace screenshot
                          </label>
                        </div>
                      )}
                      <p className="mt-2 text-xs leading-5 text-[#8B929F]">Upload the successful UPI payment confirmation. Your registration stays pending until an admin verifies it.</p>
                    </div>
                  </div>
                )}

                {paymentError && (
                  <div role="alert" className="border border-red-500/20 bg-red-500/[0.05] p-3 text-sm text-red-300">
                    {paymentError}
                  </div>
                )}
                <div className="flex flex-col-reverse gap-3 border-t border-[#3B82D6]/20 pt-4 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentError("");
                      setStep("payment");
                    }}
                    disabled={paymentLoading}
                    className="flex-1 border border-[#3B82D6]/30 px-5 py-3 text-sm font-semibold text-[#AEBBD0]">
                    Back to Payment
                  </button>
                  <button type="button" onClick={handlePayment} disabled={!canProceedToPayment || paymentLoading || !transactionId.trim() || !paymentScreenshot} className="flex-1 bg-[#1E4F9A] px-5 py-3 text-sm font-semibold text-[#E8E5DF] disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-[#AEBBD0]">
                    {paymentLoading ? "Submitting..." : registrationId ? "Retry Screenshot Upload" : "Submit Payment Details"}
                  </button>
                </div>
                <p className="text-center text-xs text-[#8B929F]">Your registration remains pending until an admin verifies your payment.</p>
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
              {Number(event.registrationFee ?? 0) > 0 ? "Payment Submitted!" : "Registration Confirmed!"}
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#AEBBD0]">{Number(event.registrationFee ?? 0) > 0 ? "Your UPI payment details have been submitted successfully. Your registration is pending verification by the AI Nexus admin team. You will receive your confirmation and tickets once the payment is verified." : "Your free event registration has been completed successfully. Your team is registered, and confirmation emails with hall tickets will be sent to the team members."}</p>

            <button type="button" onClick={() => navigate("/profile")} className="mt-7 w-full rounded-none bg-[#1E4F9A] px-6 py-4 text-sm font-semibold text-[#E8E5DF] transition hover:bg-[#3B82D6]">
              Go to Profile
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

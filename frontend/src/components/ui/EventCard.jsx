import { useEffect, useState } from "react";
import { CalendarDays, ArrowUpRight, Ticket, X, Building2, IndianRupee, Users } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

function getThumbnailUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;

  return `${SUPABASE_URL}/storage/v1/object/public/ainexus-assets/${path}`;
}

export default function EventCard({ event, onViewDetails, onRegister, isPast = false }) {
  const [showDetails, setShowDetails] = useState(false);

  const thumbnail = getThumbnailUrl(event.thumbnailPath);

  const formattedDate = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Date to be announced";

  // Normalize registration status
  const registrationStatus = String(event.registrationStatus ?? "")
    .trim()
    .toUpperCase();

  const registrationOpen = registrationStatus === "OPEN";
  const registrationUpcoming = registrationStatus === "UPCOMING";

  // Registration labels
  const cardButtonText = registrationOpen ? "Register" : registrationUpcoming ? "Coming Soon" : "Registration Closed";

  const modalButtonText = registrationOpen ? "Register Now" : registrationUpcoming ? "Registration Opens Soon" : "Registration Closed";

  const registrationInfoText = isPast ? "Event Completed" : registrationOpen ? "Open" : registrationUpcoming ? "Coming Soon" : "Closed";

  useEffect(() => {
    if (!showDetails) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") setShowDetails(false);
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [showDetails]);

  const handleRegister = () => {
    setShowDetails(false);
    onRegister?.(event);
  };

  return (
    <>
      {/* Event Card */}
      <article className="group overflow-hidden rounded-2xl border border-white/10 bg-[#111318] transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-xl">
        <div className="relative aspect-video overflow-hidden bg-[#1c1f26]">
          {thumbnail ? <img src={thumbnail} alt={event.eventName} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-sm text-gray-500">No thumbnail available</div>}

          <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-medium backdrop-blur-md ${isPast ? "bg-gray-800/80 text-gray-300" : "bg-green-500/15 text-green-400"}`}>{isPast ? "Past Event" : "Upcoming"}</span>
        </div>

        <div className="space-y-4 p-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <CalendarDays size={14} />
              <span>{formattedDate}</span>
            </div>

            <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-indigo-400">{event.eventName}</h3>

            <p className="line-clamp-2 min-h-10 text-sm leading-relaxed text-gray-400">{event.description || "More details coming soon."}</p>
          </div>

          <div className="flex gap-3 border-t border-white/10 pt-4">
            <button onClick={() => setShowDetails(true)} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-sm font-medium text-gray-200 transition hover:bg-white/5">
              View Details
              <ArrowUpRight size={15} />
            </button>

            {!isPast && (
              <button onClick={handleRegister} disabled={!registrationOpen} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400">
                <Ticket size={15} />
                {cardButtonText}
              </button>
            )}
          </div>
        </div>
      </article>

      {/* Event Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setShowDetails(false)}>
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111318] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button onClick={() => setShowDetails(false)} className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-2 text-white transition hover:bg-white/20" aria-label="Close event details">
              <X size={20} />
            </button>

            {/* Thumbnail */}
            <div className="relative aspect-video bg-[#1c1f26]">
              {thumbnail ? <img src={thumbnail} alt={event.eventName} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-gray-500">No thumbnail available</div>}

              <div className="absolute inset-0 bg-gradient-to-t from-[#111318] to-transparent" />

              <span className="absolute bottom-4 left-6 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-300">{isPast ? "Past Event" : "Upcoming Event"}</span>
            </div>

            {/* Details */}
            <div className="space-y-6 p-6 sm:p-8">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white sm:text-3xl">{event.eventName}</h2>

                <p className="whitespace-pre-line text-sm leading-7 text-gray-400">{event.description || "No description available."}</p>
              </div>

              {/* Event Information */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <CalendarDays className="shrink-0 text-indigo-400" size={20} />
                  <div>
                    <p className="text-xs text-gray-500">Event Date</p>
                    <p className="text-sm font-medium text-white">{formattedDate}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <IndianRupee className="shrink-0 text-indigo-400" size={20} />
                  <div>
                    <p className="text-xs text-gray-500">Registration Fee</p>
                    <p className="text-sm font-medium text-white">{event.registrationFee > 0 ? `₹${event.registrationFee}` : "Free"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <Building2 className="shrink-0 text-indigo-400" size={20} />
                  <div>
                    <p className="text-xs text-gray-500">Eligibility</p>
                    <p className="text-sm font-medium text-white">{event.collegeOnly ? "Acropolis Students Only" : "Open to All"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <Users className="shrink-0 text-indigo-400" size={20} />
                  <div>
                    <p className="text-xs text-gray-500">Registration</p>
                    <p className={`text-sm font-medium ${registrationOpen && !isPast ? "text-green-400" : registrationUpcoming && !isPast ? "text-blue-400" : "text-gray-400"}`}>{registrationInfoText}</p>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                <button onClick={() => setShowDetails(false)} className="rounded-lg border border-white/10 px-5 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/5">
                  Close
                </button>

                {!isPast && (
                  <button onClick={handleRegister} disabled={!registrationOpen} className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400">
                    <Ticket size={17} />
                    {modalButtonText}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, UserRound, Mail, ShieldCheck, LogOut, CalendarDays, Users, IndianRupee } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { getMyRegisteredEvents } from "../services/events";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState("");

  // Fetch registered events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setEventsLoading(true);
        setEventsError("");

        const data = await getMyRegisteredEvents();
        setEvents(Array.isArray(data) ? data : []);
      } catch (error) {
        setEventsError(error.message || "Unable to load registered events.");
      } finally {
        setEventsLoading(false);
      }
    };

    if (user) {
      fetchEvents();
    } else {
      setEvents([]);
      setEventsLoading(false);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatRegistrationDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="profile-editorial starfield min-h-screen bg-[#00001F] px-4 py-6 text-[#E8E5DF] sm:px-6 sm:py-8">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap');
        .profile-editorial {
          font-family: "Playfair Display", "Iowan Old Style", Baskerville, Georgia, serif;
          background-image:
            radial-gradient(1px 1px at 8% 18%, rgba(232,229,223,.72) 50%, transparent 100%),
            radial-gradient(1px 1px at 24% 72%, rgba(174,187,208,.55) 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 48% 28%, rgba(232,229,223,.6) 50%, transparent 100%),
            radial-gradient(1px 1px at 71% 82%, rgba(111,145,216,.75) 50%, transparent 100%),
            radial-gradient(1px 1px at 88% 34%, rgba(232,229,223,.65) 50%, transparent 100%);
          background-size: 420px 360px;
          isolation: isolate;
        }
        .profile-editorial h1,
        .profile-editorial h2,
        .profile-editorial h3,
        .profile-editorial h4 { font-family: "Playfair Display", "Iowan Old Style", Baskerville, Georgia, serif; }
        .profile-editorial button:focus-visible,
        .profile-editorial a:focus-visible {
          outline: 2px solid #6F91D8;
          outline-offset: 4px;
        }
      `}</style>

      <div className="mx-auto max-w-5xl">
        {/* Back Navigation */}
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-xs text-[#AEBBD0] transition hover:text-[#E8E5DF]">
          <ArrowLeft size={17} />
          Back to Home
        </Link>

        {/* Heading */}
        <div className="mb-6 border-b border-[#3B82D6]/20 pb-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3B82D6]">Account Dashboard</p>

          <h1 className="mt-2 text-3xl font-medium tracking-tight text-[#E8E5DF] sm:text-4xl">My Profile</h1>

          <p className="mt-2 text-sm leading-6 text-[#AEBBD0]">Manage your AI Nexus Club account and personal information.</p>
        </div>

        {/* Profile Card */}
        <div className="overflow-hidden border border-[#3B82D6]/20 bg-[#080D24]/85 shadow-[0_24px_80px_rgba(0,0,0,.18)]">
          {/* Profile Header */}
          <div className="border-b border-[#3B82D6]/20 bg-gradient-to-r from-[#3B82D6]/10 to-transparent p-5 sm:p-7">
            <div className="flex flex-col items-center gap-5 sm:flex-row">
              <div className="flex h-20 w-20 items-center justify-center rounded-none border border-blue-400/20 bg-[#3B82D6]/10">
                <UserRound size={40} className="text-[#3B82D6]" />
              </div>

              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-medium tracking-tight text-[#E8E5DF] sm:text-3xl">{user?.name}</h2>

                <div className="mt-3 inline-flex items-center gap-2 rounded-none border border-emerald-400/20 bg-emerald-500/5 px-3 py-1 text-xs font-medium text-emerald-300">
                  <ShieldCheck size={14} />
                  Authenticated Account
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="space-y-8 p-4 sm:p-6 lg:p-7">
            <div className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#3B82D6]">ACCOUNT · 01</p>
              <h3 className="mt-2 text-xl font-medium text-[#E8E5DF]">Personal Information</h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Name */}
              <div className="border border-[#3B82D6]/20 bg-[#00001F]/55 p-4 sm:p-5">
                <div className="flex items-center gap-3 text-[#8B929F]">
                  <UserRound size={18} />
                  <span className="text-xs font-medium uppercase tracking-wider">Full Name</span>
                </div>

                <p className="mt-3 break-words font-medium text-[#E8E5DF]">{user?.name}</p>
              </div>

              {/* Email */}
              <div className="border border-[#3B82D6]/20 bg-[#00001F]/55 p-4 sm:p-5">
                <div className="flex items-center gap-3 text-[#8B929F]">
                  <Mail size={18} />
                  <span className="text-xs font-medium uppercase tracking-wider">Email Address</span>
                </div>

                <p className="mt-3 break-all font-medium text-[#E8E5DF]">{user?.email}</p>
              </div>

              {/* User ID */}
              <div className="rounded-none border border-[#3B82D6]/20 bg-[#00001F]/55 p-5 sm:col-span-2">
                <div className="flex items-center gap-3 text-[#8B929F]">
                  <ShieldCheck size={18} />
                  <span className="text-xs font-medium uppercase tracking-wider">User ID</span>
                </div>

                <p className="mt-4 break-all font-mono text-sm text-[#AEBBD0]">{user?.userId}</p>
              </div>
            </div>

            {/* My Registered Events */}
            <div className="border-t border-[#3B82D6]/20 pt-6">
              <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#3B82D6]">ACTIVITY · 02</p>
                  <h3 className="mt-2 text-xl font-medium text-[#E8E5DF]">My Registered Events</h3>

                  <p className="mt-1 text-sm text-[#AEBBD0]">Events you've successfully registered for.</p>
                </div>

                {!eventsLoading && !eventsError && (
                  <div className="w-fit rounded-none border border-[#3B82D6]/25 bg-[#3B82D6]/10 px-3 py-2 text-sm font-semibold text-[#3B82D6]">
                    {events.length} {events.length === 1 ? "Event" : "Events"}
                  </div>
                )}
              </div>

              {/* Loading */}
              {eventsLoading ? (
                <div className="flex items-center justify-center gap-3 border border-[#3B82D6]/20 bg-[#00001F]/55 py-10 text-sm text-[#AEBBD0]">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                  Loading your registrations...
                </div>
              ) : eventsError ? (
                /* Error */
                <div className="border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">{eventsError}</div>
              ) : events.length === 0 ? (
                /* Empty State */
                <div className="border border-[#3B82D6]/20 bg-[#00001F]/55 px-5 py-9 text-center">
                  <CalendarDays size={36} className="mx-auto text-[#8B929F]" />

                  <h4 className="mt-4 font-semibold">No registrations yet</h4>

                  <p className="mt-2 text-sm text-[#AEBBD0]">You haven't registered for any events yet.</p>
                </div>
              ) : (
                /* Registered Events */
                <div className="grid gap-3 sm:grid-cols-2">
                  {events.map((event) => (
                    <div key={event.eventId} className="overflow-hidden border border-[#3B82D6]/20 bg-[#00001F]/55 transition hover:border-[#3B82D6]/50">
                      {/* Event Thumbnail */}
                      {event.thumbnailPath && <img src={event.thumbnailPath} alt={event.eventName} className="h-36 w-full object-cover sm:h-40" />}

                      <div className="p-4 sm:p-5">
                        {/* Event Name */}
                        <h4 className="text-lg font-medium text-[#E8E5DF]">{event.eventName}</h4>

                        {/* Description */}
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#AEBBD0] sm:text-sm">{event.description}</p>

                        {/* Event Details */}
                        <div className="mt-4 space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-[#AEBBD0]">
                            <CalendarDays size={16} className="shrink-0 text-[#3B82D6]" />
                            {formatDate(event.eventDate)}
                          </div>

                          {event.teamName && (
                            <div className="flex items-center gap-2 text-[#AEBBD0]">
                              <Users size={16} className="shrink-0 text-[#3B82D6]" />
                              <span className="truncate">{event.teamName}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-[#AEBBD0]">
                            <IndianRupee size={16} className="shrink-0 text-[#3B82D6]" />
                            {event.registrationFee === 0 ? "Free Event" : `₹${event.registrationFee}`}
                          </div>

                          <p className="text-[#AEBBD0]">
                            Registered on: <span className="text-[#E8E5DF]">{formatRegistrationDate(event.registrationDate)}</span>
                          </p>
                        </div>

                        {/* Registration Status */}
                        <div className="mt-4 border-t border-[#3B82D6]/20 pt-3">
                          <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-300">
                            <ShieldCheck size={14} />
                            Registration Confirmed
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Account Actions */}
            <div className="border-t border-[#3B82D6]/20 pt-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#3B82D6]">SESSION · 03</p>
              <h3 className="mb-4 mt-2 text-xl font-medium text-[#E8E5DF]">Account Actions</h3>

              <button onClick={handleLogout} className="inline-flex items-center gap-2 border border-red-500/25 bg-red-500/5 px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10">
                <LogOut size={17} />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-5 text-center text-[10px] tracking-wide text-[#8B929F]">AI Nexus Club · Acropolis Institute of Technology and Research</p>
      </div>
    </div>
  );
}

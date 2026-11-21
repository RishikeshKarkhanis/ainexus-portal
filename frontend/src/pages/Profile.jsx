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
    <div className="min-h-screen bg-[#080B16] px-5 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        {/* Back Navigation */}
        <Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
          <ArrowLeft size={17} />
          Back to Home
        </Link>

        {/* Heading */}
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">Account Dashboard</p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">My Profile</h1>

          <p className="mt-3 text-sm text-slate-400">Manage your AI Nexus account and personal information.</p>
        </div>

        {/* Profile Card */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#11182B]">
          {/* Profile Header */}
          <div className="border-b border-white/10 bg-gradient-to-r from-blue-600/10 to-violet-600/10 p-8">
            <div className="flex flex-col items-center gap-5 sm:flex-row">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10">
                <UserRound size={40} className="text-blue-400" />
              </div>

              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-bold">{user?.name}</h2>

                <p className="mt-2 text-sm text-slate-400">AI Nexus Member</p>

                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/5 px-3 py-1 text-xs font-medium text-green-400">
                  <ShieldCheck size={14} />
                  Authenticated Account
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="p-8">
            <h3 className="mb-6 text-lg font-semibold">Personal Information</h3>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Name */}
              <div className="rounded-xl border border-white/10 bg-[#0D1222] p-5">
                <div className="flex items-center gap-3 text-slate-500">
                  <UserRound size={18} />
                  <span className="text-xs font-medium uppercase tracking-wider">Full Name</span>
                </div>

                <p className="mt-4 font-medium text-white">{user?.name}</p>
              </div>

              {/* Email */}
              <div className="rounded-xl border border-white/10 bg-[#0D1222] p-5">
                <div className="flex items-center gap-3 text-slate-500">
                  <Mail size={18} />
                  <span className="text-xs font-medium uppercase tracking-wider">Email Address</span>
                </div>

                <p className="mt-4 break-all font-medium text-white">{user?.email}</p>
              </div>

              {/* User ID */}
              <div className="rounded-xl border border-white/10 bg-[#0D1222] p-5 sm:col-span-2">
                <div className="flex items-center gap-3 text-slate-500">
                  <ShieldCheck size={18} />
                  <span className="text-xs font-medium uppercase tracking-wider">User ID</span>
                </div>

                <p className="mt-4 break-all font-mono text-sm text-slate-300">{user?.userId}</p>
              </div>
            </div>

            {/* My Registered Events */}
            <div className="mt-10 border-t border-white/10 pt-8">
              <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-lg font-semibold">My Registered Events</h3>

                  <p className="mt-1 text-sm text-slate-400">Events you've successfully registered for.</p>
                </div>

                {!eventsLoading && !eventsError && (
                  <div className="w-fit rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-sm font-semibold text-blue-400">
                    {events.length} {events.length === 1 ? "Event" : "Events"}
                  </div>
                )}
              </div>

              {/* Loading */}
              {eventsLoading ? (
                <div className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-[#0D1222] py-12 text-sm text-slate-400">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                  Loading your registrations...
                </div>
              ) : eventsError ? (
                /* Error */
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-400">{eventsError}</div>
              ) : events.length === 0 ? (
                /* Empty State */
                <div className="rounded-xl border border-white/10 bg-[#0D1222] px-5 py-10 text-center">
                  <CalendarDays size={36} className="mx-auto text-slate-500" />

                  <h4 className="mt-4 font-semibold">No registrations yet</h4>

                  <p className="mt-2 text-sm text-slate-400">You haven't registered for any events yet.</p>
                </div>
              ) : (
                /* Registered Events */
                <div className="grid gap-5 sm:grid-cols-2">
                  {events.map((event) => (
                    <div key={event.eventId} className="overflow-hidden rounded-xl border border-white/10 bg-[#0D1222] transition hover:border-blue-500/30">
                      {/* Event Thumbnail */}
                      {event.thumbnailPath && <img src={event.thumbnailPath} alt={event.eventName} className="h-40 w-full object-cover" />}

                      <div className="p-5">
                        {/* Event Name */}
                        <h4 className="text-lg font-semibold">{event.eventName}</h4>

                        {/* Description */}
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-400">{event.description}</p>

                        {/* Event Details */}
                        <div className="mt-5 space-y-3 text-sm">
                          <div className="flex items-center gap-2 text-slate-300">
                            <CalendarDays size={16} className="shrink-0 text-blue-400" />
                            {formatDate(event.eventDate)}
                          </div>

                          {event.teamName && (
                            <div className="flex items-center gap-2 text-slate-300">
                              <Users size={16} className="shrink-0 text-blue-400" />
                              <span className="truncate">{event.teamName}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-slate-300">
                            <IndianRupee size={16} className="shrink-0 text-blue-400" />
                            {event.registrationFee === 0 ? "Free Event" : `₹${event.registrationFee}`}
                          </div>

                          <p className="text-slate-400">
                            Registered on: <span className="text-slate-200">{formatRegistrationDate(event.registrationDate)}</span>
                          </p>
                        </div>

                        {/* Registration Status */}
                        <div className="mt-5 border-t border-white/10 pt-4">
                          <span className="inline-flex items-center gap-2 text-xs font-semibold text-green-400">
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
            <div className="mt-10 border-t border-white/10 pt-7">
              <h3 className="mb-5 text-lg font-semibold">Account Actions</h3>

              <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-5 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10">
                <LogOut size={17} />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-slate-600">AI Nexus · Acropolis Institute of Technology and Research</p>
      </div>
    </div>
  );
}

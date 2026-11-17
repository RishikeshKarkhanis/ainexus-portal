import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { apiRequest } from "../lib/api";
import EventCard from "../components/ui/EventCard";

export default function Events() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await apiRequest("/api/events");
        setEvents(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Failed to load events.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = events.filter((event) => {
    if (!event.eventDate) return true;

    const eventDate = new Date(event.eventDate);
    return !isNaN(eventDate) && eventDate >= today;
  });

  const pastEvents = events.filter((event) => {
    if (!event.eventDate) return false;

    const eventDate = new Date(event.eventDate);
    return !isNaN(eventDate) && eventDate < today;
  });

  const handleViewDetails = (event) => {
    navigate(`/events/${event.eventId}`);
  };

  const handleRegister = (event) => {
    if (event.registrationStatus !== "OPEN") return;

    navigate(`/events/${event.eventId}/register`);
  };

  const renderEvents = (eventList, isPast = false) => {
    if (!eventList.length) {
      return (
        <div className="col-span-full rounded-xl border border-white/10 bg-[#111318] py-12 text-center">
          <p className="text-gray-400">{isPast ? "No past events available." : "No upcoming events at the moment."}</p>
        </div>
      );
    }

    return eventList.map((event) => <EventCard key={event.eventId} event={event} isPast={isPast} onViewDetails={handleViewDetails} onRegister={handleRegister} />);
  };

  return (
    <main className="min-h-screen bg-[#090a0f] px-5 py-16 text-white sm:px-8">
      <div className="mx-auto max-w-7xl space-y-16">
        {/* Page Header */}
        <header className="space-y-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-400">AI Nexus · Acropolis</p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Explore Events</h1>

          <p className="mx-auto max-w-2xl text-gray-400">Discover upcoming events, participate in exciting experiences, and explore what we've accomplished.</p>
        </header>

        {/* Loading */}
        {loading && <div className="py-16 text-center text-gray-400">Loading events...</div>}

        {/* Error */}
        {!loading && error && <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center text-red-400">{error}</div>}

        {!loading && !error && (
          <>
            {/* Upcoming Events */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Upcoming Events</h2>
                  <p className="mt-1 text-sm text-gray-400">Be a part of what's next.</p>
                </div>

                <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">{upcomingEvents.length} Events</span>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{renderEvents(upcomingEvents)}</div>
            </section>

            {/* Past Events */}
            <section className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Past Events</h2>
                <p className="mt-1 text-sm text-gray-400">A look back at our previous events.</p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{renderEvents(pastEvents, true)}</div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

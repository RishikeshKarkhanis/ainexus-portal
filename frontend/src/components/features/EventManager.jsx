import { useEffect, useState } from "react";
import { CalendarDays, Plus, Pencil, Trash2, LoaderCircle, IndianRupee, AlertCircle, ImagePlus, X } from "lucide-react";

import { adminApiRequest } from "../../lib/api";

const emptyForm = {
  eventName: "",
  description: "",
  eventDate: "",
  registrationFee: 0,
  minTeamSize: 1,
  maxTeamSize: 4,
  collegeOnly: false,
  registrationStatus: "DRAFT",
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_BUCKET = "ainexus-assets";

const getThumbnailUrl = (path) => {
  if (!path || !SUPABASE_URL) return "";

  return `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/${SUPABASE_BUCKET}/${path}`;
};

function EventManager() {
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventError, setEventError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [thumbnailError, setThumbnailError] = useState("");
  const [thumbnailLoadError, setThumbnailLoadError] = useState(false);

  const [savingEvent, setSavingEvent] = useState(false);
  const [creatingDraft, setCreatingDraft] = useState(false);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const inputClass = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500";

  // Generate local image preview
  useEffect(() => {
    if (!thumbnailFile) {
      setThumbnailPreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(thumbnailFile);
    setThumbnailPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [thumbnailFile]);

  useEffect(() => {
    setThumbnailLoadError(false);
  }, [thumbnailPreview, editingEvent?.thumbnailPath]);

  // Fetch all events
  const fetchEvents = async () => {
    setLoadingEvents(true);
    setEventError("");

    try {
      const data = await adminApiRequest("/api/events");
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setEventError(err.message || "Unable to fetch events.");
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Create draft and open editor
  const openAddModal = async () => {
    setCreatingDraft(true);
    setError("");
    setSuccess("");
    setEventError("");

    try {
      const draft = await adminApiRequest("/api/events/draft", {
        method: "POST",
      });

      setEditingEvent(draft);

      setForm({
        eventName: draft.eventName ?? "",
        description: draft.description ?? "",
        eventDate: draft.eventDate ?? "",
        registrationFee: draft.registrationFee ?? 0,
        minTeamSize: draft.minTeamSize ?? 1,
        maxTeamSize: draft.maxTeamSize ?? 4,
        collegeOnly: draft.collegeOnly ?? true,
        registrationStatus: draft.registrationStatus ?? "DRAFT",
      });

      setThumbnailFile(null);
      setThumbnailError("");
      setThumbnailLoadError(false);
      setModalOpen(true);
    } catch (err) {
      setEventError(err.message || "Unable to create draft event.");
    } finally {
      setCreatingDraft(false);
    }
  };

  // Edit existing event
  const openEditModal = (event) => {
    setEditingEvent(event);

    setForm({
      eventName: event.eventName ?? "",
      description: event.description ?? "",
      eventDate: event.eventDate ?? "",
      registrationFee: event.registrationFee ?? 0,
      minTeamSize: event.minTeamSize ?? 1,
      maxTeamSize: event.maxTeamSize ?? 4,
      collegeOnly: event.collegeOnly ?? false,
      registrationStatus: event.registrationStatus ?? "OPEN",
    });

    setThumbnailFile(null);
    setThumbnailError("");
    setThumbnailLoadError(false);
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  // Close editor
  const closeModal = () => {
    if (savingEvent) return;

    setModalOpen(false);
    setEditingEvent(null);
    setForm(emptyForm);
    setThumbnailFile(null);
    setThumbnailError("");
    setThumbnailLoadError(false);
    setError("");
  };

  // Handle form changes
  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle thumbnail selection
  const handleThumbnailChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setThumbnailError("Only JPEG, PNG and WebP images are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setThumbnailError("Image must be under 10 MB.");
      event.target.value = "";
      return;
    }

    setThumbnailError("");
    setThumbnailLoadError(false);
    setThumbnailFile(file);
  };

  // Remove selected thumbnail
  const removeSelectedThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailError("");
    setThumbnailLoadError(false);
  };

  // Save event and optional thumbnail
  const handleSaveEvent = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!editingEvent) {
      setError("No event selected.");
      return;
    }

    if (Number(form.registrationFee) < 0) {
      setError("Registration fee cannot be negative.");
      return;
    }

    const minTeamSize = Number(form.minTeamSize);
    const maxTeamSize = Number(form.maxTeamSize);

    if (
      !Number.isInteger(minTeamSize) ||
      !Number.isInteger(maxTeamSize) ||
      minTeamSize < 1 ||
      maxTeamSize < 1
    ) {
      setError("Team sizes must be whole numbers of at least 1.");
      return;
    }

    if (minTeamSize > maxTeamSize) {
      setError("Minimum team size cannot be greater than maximum team size.");
      return;
    }

    const payload = {
      ...form,
      registrationFee: Number(form.registrationFee),
      minTeamSize,
      maxTeamSize,
      registrationStatus: form.registrationStatus.toUpperCase(),
    };

    setSavingEvent(true);

    try {
      // First update event details using JSON
      await adminApiRequest(`/api/events/${editingEvent.eventId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      // Then upload thumbnail separately, if selected
      if (thumbnailFile) {
        const formData = new FormData();
        formData.append("file", thumbnailFile);

        await adminApiRequest(`/api/events/${editingEvent.eventId}/thumbnail`, {
          method: "POST",
          body: formData,
        });
      }

      setSuccess("Event saved successfully.");

      setModalOpen(false);
      setEditingEvent(null);
      setForm(emptyForm);
      setThumbnailFile(null);

      await fetchEvents();
    } catch (err) {
      setError(err.message || "Unable to save event.");
    } finally {
      setSavingEvent(false);
    }
  };

  // Delete event
  const handleDeleteEvent = async (event) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${event.eventName}"?`);

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await adminApiRequest(`/api/events/${event.eventId}`, {
        method: "DELETE",
      });

      setSuccess("Event deleted successfully.");
      await fetchEvents();
    } catch (err) {
      setEventError(err.message || "Unable to delete event.");
    }
  };

  const currentThumbnail = thumbnailPreview ? thumbnailPreview : editingEvent?.thumbnailPath ? getThumbnailUrl(editingEvent.thumbnailPath) : "";

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Events</h2>
          <p className="mt-1 text-sm text-gray-500">Create, update and remove club events.</p>
        </div>

        <button onClick={openAddModal} disabled={creatingDraft} className="flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm text-white transition hover:bg-gray-800 disabled:opacity-60">
          {creatingDraft ? <LoaderCircle size={17} className="animate-spin" /> : <Plus size={17} />}
          {creatingDraft ? "Creating Draft..." : "Add Event"}
        </button>
      </div>

      {/* Success */}
      {success && !modalOpen && <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

      {/* Error */}
      {eventError && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={17} />
          {eventError}
          <button onClick={fetchEvents} className="ml-auto underline">
            Retry
          </button>
        </div>
      )}

      {/* Events List */}
      {loadingEvents ? (
        <div className="flex justify-center py-16 text-gray-500">
          <LoaderCircle className="animate-spin" size={25} />
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <CalendarDays size={36} className="mx-auto mb-3 text-gray-400" />
          <h3 className="text-base font-medium text-gray-800">No events to display</h3>
          <p className="mt-1 text-sm text-gray-500">Create your first event to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.eventId} className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{event.eventName}</h3>

                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${event.registrationStatus === "OPEN" ? "bg-green-50 text-green-700" : event.registrationStatus === "DRAFT" ? "bg-yellow-50 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>{event.registrationStatus}</span>
                </div>

                <p className="mt-2 line-clamp-2 text-sm text-gray-500">{event.description}</p>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
                  <span>{event.eventDate}</span>

                  <span className="flex items-center gap-1">
                    <IndianRupee size={13} />
                    {event.registrationFee}
                  </span>

                  <span>{event.collegeOnly ? "Acropolis only" : "Open to all"}</span>
                  <span>
                    Team size: {event.minTeamSize ?? 1}–{event.maxTeamSize ?? 4}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button onClick={() => openEditModal(event)} title="Edit event" className="rounded-lg border border-gray-200 p-2.5 text-gray-600 transition hover:bg-gray-100">
                  <Pencil size={17} />
                </button>

                <button onClick={() => handleDeleteEvent(event)} title="Delete event" className="rounded-lg border border-red-100 p-2.5 text-red-600 transition hover:bg-red-50">
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}>
          <div className="my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{editingEvent?.registrationStatus === "DRAFT" ? "Create Event" : "Edit Event"}</h2>
                <p className="mt-1 text-sm text-gray-500">Enter the event details below.</p>
              </div>

              <button onClick={closeModal} disabled={savingEvent} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <form onSubmit={handleSaveEvent} className="space-y-4">
              {/* Event Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Event Name</label>
                <input name="eventName" value={form.eventName} onChange={handleFormChange} placeholder="e.g. IntelliAI Arena 2026" className={inputClass} required />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
                <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="Describe your event..." rows={4} className={inputClass} required />
              </div>

              {/* Date and Fee */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Event Date</label>
                  <input type="date" name="eventDate" value={form.eventDate} onChange={handleFormChange} min={new Date().toLocaleDateString("en-CA")} className={inputClass} required />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Registration Fee (₹)</label>
                  <input type="number" name="registrationFee" value={form.registrationFee} onChange={handleFormChange} min="0" step="1" className={inputClass} required />
                </div>
              </div>

              {/* Team Size */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Minimum Team Size
                  </label>
                  <input
                    type="number"
                    name="minTeamSize"
                    value={form.minTeamSize}
                    onChange={handleFormChange}
                    min="1"
                    step="1"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Maximum Team Size
                  </label>
                  <input
                    type="number"
                    name="maxTeamSize"
                    value={form.maxTeamSize}
                    onChange={handleFormChange}
                    min={form.minTeamSize || 1}
                    step="1"
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              {/* Registration Status */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Registration Status</label>
                <select name="registrationStatus" value={form.registrationStatus} onChange={handleFormChange} className={inputClass}>
                  <option value="DRAFT">Draft</option>
                  <option value="UPCOMING">Upcoming</option>
                  <option value="OPEN">Open</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              {/* College Only */}
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3">
                <input type="checkbox" name="collegeOnly" checked={form.collegeOnly} onChange={handleFormChange} className="h-4 w-4 accent-black" />
                <span className="text-sm text-gray-700">Restrict this event to Acropolis students</span>
              </label>

              {/* Thumbnail Upload */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Event Thumbnail</label>

                {currentThumbnail && !thumbnailLoadError ? (
                  <div className="relative mb-3 overflow-hidden rounded-lg border border-gray-200">
                    <img key={currentThumbnail} src={currentThumbnail} alt="Event thumbnail" className="h-48 w-full object-cover" onError={() => setThumbnailLoadError(true)} />

                    {thumbnailFile && <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2.5 py-1 text-xs text-white">New image selected</span>}
                  </div>
                ) : (
                  <div className="mb-3 flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
                    <div className="text-center">
                      <ImagePlus size={30} className="mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500">{thumbnailLoadError ? "Unable to load thumbnail" : "No thumbnail available"}</p>
                    </div>
                  </div>
                )}

                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                  <ImagePlus size={17} />
                  {thumbnailFile ? "Change Thumbnail" : "Choose Thumbnail"}
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleThumbnailChange} className="hidden" />
                </label>

                {thumbnailFile && (
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-xs text-gray-500">{thumbnailFile.name}</p>
                    <button type="button" onClick={removeSelectedThumbnail} className="shrink-0 text-xs font-medium text-red-600 hover:underline">
                      Remove
                    </button>
                  </div>
                )}

                {thumbnailError && <p className="mt-2 text-xs text-red-600">{thumbnailError}</p>}

                <p className="mt-2 text-xs text-gray-400">PNG, JPEG or WebP · Maximum 10 MB</p>
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeModal} disabled={savingEvent} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>

                <button type="submit" disabled={savingEvent} className="flex items-center justify-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60">
                  {savingEvent && <LoaderCircle size={16} className="animate-spin" />}
                  {savingEvent ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventManager;

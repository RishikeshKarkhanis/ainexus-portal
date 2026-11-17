package com.ainexus.backend.service;

import com.ainexus.backend.dto.request.EventRequest;
import com.ainexus.backend.dto.response.EventResponse;
import com.ainexus.backend.entity.Event;
import com.ainexus.backend.repository.EventRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final SupabaseStorageService supabaseStorageService;
    private final JdbcTemplate jdbcTemplate;

    // Convert Entity into Response DTO
    private EventResponse toResponse(Event event) {
        return new EventResponse(
                event.getEventId(),
                event.getEventName(),
                event.getDescription(),
                event.getEventDate(),
                event.getRegistrationFee(),
                event.getCollegeOnly(),
                event.getRegistrationStatus(),
                event.getThumbnailPath(),
                event.getCreatedAt(),
                event.getMinTeamSize(),
                event.getMaxTeamSize()
        );
    }

    // Get all events
    public List<EventResponse> getAllEvents() {
        return eventRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // Get event by ID
    public EventResponse getEventById(UUID eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Event not found"
                ));

        return toResponse(event);
    }

    // Get upcoming events
    public List<EventResponse> getUpcomingEvents() {
        return eventRepository.findAll()
                .stream()
                .filter(event ->
                        !event.getEventDate().isBefore(LocalDate.now())
                )
                .map(this::toResponse)
                .toList();
    }

    // Get events by registration status
    public List<EventResponse> getEventsByStatus(String status) {
        return eventRepository.findByRegistrationStatus(status)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // Get college-only events
    public List<EventResponse> getCollegeOnlyEvents() {
        return eventRepository.findByCollegeOnly(true)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // Create a default draft event
    public EventResponse createDraftEvent() {

        Event event = new Event();

        event.setEventName("Untitled Event");
        event.setDescription("Draft event");
        event.setEventDate(LocalDate.now());
        event.setRegistrationFee(0);
        event.setCollegeOnly(true);
        event.setRegistrationStatus("DRAFT");
        event.setThumbnailPath(null);
        event.setMinTeamSize(1);
        event.setMaxTeamSize(4);

        Event savedEvent = eventRepository.save(event);

        return toResponse(savedEvent);
    }

    // Create event
    public EventResponse createEvent(EventRequest request) {

        Event event = new Event();

        event.setEventName(request.getEventName().trim());
        event.setDescription(request.getDescription().trim());
        event.setEventDate(request.getEventDate());
        event.setRegistrationFee(request.getRegistrationFee());
        event.setCollegeOnly(request.getCollegeOnly());
        event.setRegistrationStatus(
                request.getRegistrationStatus().trim().toUpperCase(Locale.ROOT)
        );

        Integer minSize = request.getMinTeamSize() != null
                ? request.getMinTeamSize() : 1;

        Integer maxSize = request.getMaxTeamSize() != null
                ? request.getMaxTeamSize() : 4;

        validateTeamSize(minSize, maxSize);

        event.setMinTeamSize(minSize);
        event.setMaxTeamSize(maxSize);

        Event savedEvent = eventRepository.save(event);

        return toResponse(savedEvent);
    }

    // Update event
    public EventResponse updateEvent(UUID eventId, EventRequest request) {

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Event not found"
                ));

        event.setEventName(request.getEventName().trim());
        event.setDescription(request.getDescription().trim());
        event.setEventDate(request.getEventDate());
        event.setRegistrationFee(request.getRegistrationFee());
        event.setCollegeOnly(request.getCollegeOnly());
        event.setRegistrationStatus(
                request.getRegistrationStatus().trim().toUpperCase(Locale.ROOT)
        );

        Integer minSize = request.getMinTeamSize() != null
                ? request.getMinTeamSize() : event.getMinTeamSize();

        Integer maxSize = request.getMaxTeamSize() != null
                ? request.getMaxTeamSize() : event.getMaxTeamSize();

        validateTeamSize(minSize, maxSize);

        event.setMinTeamSize(minSize);
        event.setMaxTeamSize(maxSize);

        Event updatedEvent = eventRepository.save(event);

        return toResponse(updatedEvent);
    }

    // Update event details and optionally upload a new thumbnail
    public EventResponse updateEvent(
            UUID eventId,
            EventRequest request,
            MultipartFile file
    ) {

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Event not found"
                ));

        event.setEventName(request.getEventName().trim());
        event.setDescription(request.getDescription().trim());
        event.setEventDate(request.getEventDate());
        event.setRegistrationFee(request.getRegistrationFee());
        event.setCollegeOnly(request.getCollegeOnly());
        event.setRegistrationStatus(
                request.getRegistrationStatus().trim().toUpperCase(Locale.ROOT)
        );

        Integer minSize = request.getMinTeamSize() != null
                ? request.getMinTeamSize() : event.getMinTeamSize();

        Integer maxSize = request.getMaxTeamSize() != null
                ? request.getMaxTeamSize() : event.getMaxTeamSize();

        validateTeamSize(minSize, maxSize);

        event.setMinTeamSize(minSize);
        event.setMaxTeamSize(maxSize);

        // Save event details first
        eventRepository.save(event);

        // Upload thumbnail only if a new file was selected
        if (file != null && !file.isEmpty()) {
            return uploadThumbnail(eventId, file);
        }

        return toResponse(event);
    }

    // Delete event and all associated records
    @Transactional
    public void deleteEvent(UUID eventId) {

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Event not found"
                ));

        String thumbnailPath = event.getThumbnailPath();

        // 1. Delete attendance records
//        jdbcTemplate.update("""
//                DELETE FROM attendance
//                WHERE event_id = ?
//                   OR ticket_id IN (
//                       SELECT tk.ticket_id
//                       FROM tickets tk
//                       JOIN team_members tm
//                         ON tm.team_member_id = tk.team_member_id
//                       JOIN teams t
//                         ON t.team_id = tm.team_id
//                       WHERE t.event_id = ?
//                   )
//                """, eventId, eventId);

        // 2. Delete tickets
        jdbcTemplate.update("""
                DELETE FROM tickets
                WHERE team_member_id IN (
                    SELECT tm.team_member_id
                    FROM team_members tm
                    JOIN teams t
                      ON t.team_id = tm.team_id
                    WHERE t.event_id = ?
                )
                """, eventId);

        // 3. Delete team members
        jdbcTemplate.update("""
                DELETE FROM team_members
                WHERE team_id IN (
                    SELECT team_id
                    FROM teams
                    WHERE event_id = ?
                )
                """, eventId);

        // 4. Delete payments
        // payment_metadata is automatically deleted through ON DELETE CASCADE
        jdbcTemplate.update("""
                DELETE FROM payments
                WHERE event_id = ?
                   OR team_id IN (
                       SELECT team_id
                       FROM teams
                       WHERE event_id = ?
                   )
                """, eventId, eventId);

        // 5. Delete registrations
        jdbcTemplate.update("""
                DELETE FROM registrations
                WHERE event_id = ?
                """, eventId);

        // 6. Delete teams
        jdbcTemplate.update("""
                DELETE FROM teams
                WHERE event_id = ?
                """, eventId);

        // 7. Delete the event
        eventRepository.delete(event);

        // 8. Delete thumbnail only after successful DB commit
        if (thumbnailPath != null) {

            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {

                        @Override
                        public void afterCommit() {
                            try {
                                supabaseStorageService.deleteImage(
                                        thumbnailPath
                                );
                            } catch (Exception exception) {
                                // Storage cleanup can be retried separately.
                            }
                        }
                    }
            );
        }
    }

    // Upload event thumbnail
    public EventResponse uploadThumbnail(UUID eventId, MultipartFile file) {

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Event not found"
                ));

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please select an image"
            );
        }

        if (file.getSize() > 10 * 1024 * 1024) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Image must be under 10 MB"
            );
        }

        String contentType = file.getContentType();

        if (contentType == null || !List.of(
                "image/jpeg",
                "image/png",
                "image/webp"
        ).contains(contentType)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only JPEG, PNG and WebP images are allowed"
            );
        }

        String extension = switch (contentType) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unsupported image format"
            );
        };

        String slug = event.getEventName()
                .toLowerCase(Locale.ROOT)
                .trim()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");

        String filePath = "events/thumbnails/"
                + slug + "-" + event.getEventId() + extension;

        try {
            supabaseStorageService.uploadImage(
                    filePath,
                    file.getBytes(),
                    contentType
            );
        } catch (IOException exception) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Could not read uploaded image"
            );
        } catch (Exception exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Could not upload image to storage"
            );
        }

        String previousPath = event.getThumbnailPath();

        event.setThumbnailPath(filePath);

        Event savedEvent = eventRepository.save(event);

        // Delete the old image only after the new path is saved
        if (previousPath != null && !previousPath.equals(filePath)) {
            try {
                supabaseStorageService.deleteImage(previousPath);
            } catch (Exception ignored) {
                // Old image cleanup can be retried separately.
            }
        }

        return toResponse(savedEvent);
    }

    private void validateTeamSize(Integer minSize, Integer maxSize) {

        if (minSize == null || maxSize == null ||
                minSize < 1 || maxSize < minSize) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid team size configuration"
            );
        }
    }
}

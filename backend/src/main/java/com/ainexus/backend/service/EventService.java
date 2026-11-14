
package com.ainexus.backend.service;

import com.ainexus.backend.dto.request.EventRequest;
import com.ainexus.backend.dto.response.EventResponse;
import com.ainexus.backend.entity.Event;
import com.ainexus.backend.repository.EventRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;

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
                event.getCreatedAt()
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

    // Create event
    public EventResponse createEvent(EventRequest request) {

        Event event = new Event();

        event.setEventName(request.getEventName().trim());
        event.setDescription(request.getDescription().trim());
        event.setEventDate(request.getEventDate());
        event.setRegistrationFee(request.getRegistrationFee());
        event.setCollegeOnly(request.getCollegeOnly());
        event.setRegistrationStatus(
                request.getRegistrationStatus().trim().toUpperCase()
        );

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
                request.getRegistrationStatus().trim().toUpperCase()
        );

        Event updatedEvent = eventRepository.save(event);

        return toResponse(updatedEvent);
    }

    // Delete event
    public void deleteEvent(UUID eventId) {

        if (!eventRepository.existsById(eventId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Event not found"
            );
        }

        eventRepository.deleteById(eventId);
    }
}

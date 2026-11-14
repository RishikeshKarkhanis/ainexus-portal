
package com.ainexus.backend.controller;

import com.ainexus.backend.dto.request.EventRequest;
import com.ainexus.backend.dto.response.EventResponse;
import com.ainexus.backend.service.EventService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    // GET all events
    @GetMapping
    public List<EventResponse> getAllEvents() {
        return eventService.getAllEvents();
    }

    // GET event by ID
    @GetMapping("/{id}")
    public EventResponse getEventById(@PathVariable UUID id) {
        return eventService.getEventById(id);
    }

    // GET upcoming events
    @GetMapping("/upcoming")
    public List<EventResponse> getUpcomingEvents() {
        return eventService.getUpcomingEvents();
    }

    // GET events by registration status
    @GetMapping("/status/{status}")
    public List<EventResponse> getEventsByStatus(
            @PathVariable String status) {

        return eventService.getEventsByStatus(status);
    }

    // GET college-only events
    @GetMapping("/college-only")
    public List<EventResponse> getCollegeOnlyEvents() {
        return eventService.getCollegeOnlyEvents();
    }

    // POST create event
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EventResponse createEvent(
            @Valid @RequestBody EventRequest request) {

        return eventService.createEvent(request);
    }

    // PUT update event
    @PutMapping("/{id}")
    public EventResponse updateEvent(
            @PathVariable UUID id,
            @Valid @RequestBody EventRequest request) {

        return eventService.updateEvent(id, request);
    }

    // DELETE event
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEvent(@PathVariable UUID id) {
        eventService.deleteEvent(id);
    }
}

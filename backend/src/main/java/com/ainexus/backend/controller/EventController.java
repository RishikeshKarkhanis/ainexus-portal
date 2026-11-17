
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

import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

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

    // POST create default draft event
    @PostMapping("/draft")
    @ResponseStatus(HttpStatus.CREATED)
    public EventResponse createDraftEvent() {
        return eventService.createDraftEvent();
    }

    // POST create event
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EventResponse createEvent(
            @Valid @RequestBody EventRequest request) {

        return eventService.createEvent(request);
    }

    // Update event using JSON (without thumbnail)
    @PutMapping(
            value = "/{id}",
            consumes = MediaType.APPLICATION_JSON_VALUE
    )
    public EventResponse updateEvent(
            @PathVariable UUID id,
            @Valid @RequestBody EventRequest request
    ) {
        return eventService.updateEvent(id, request);
    }

    // Update event details and optional thumbnail
    @PutMapping(
            value = "/{id}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public EventResponse updateEventWithThumbnail(
            @PathVariable UUID id,
            @Valid @RequestPart("event") EventRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        return eventService.updateEvent(id, request, file);
    }

    // DELETE event
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEvent(@PathVariable UUID id) {
        eventService.deleteEvent(id);
    }

    // POST upload event thumbnail
    @PostMapping(
            value = "/{id}/thumbnail",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public EventResponse uploadThumbnail(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file
    ) {
        return eventService.uploadThumbnail(id, file);
    }
}

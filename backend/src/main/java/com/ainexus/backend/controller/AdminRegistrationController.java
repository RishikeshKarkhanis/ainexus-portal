package com.ainexus.backend.controller;

import com.ainexus.backend.dto.response.RegistrationDashboardResponse;
import com.ainexus.backend.entity.Event;
import com.ainexus.backend.repository.EventRepository;
import com.ainexus.backend.service.RegistrationDashboardService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/registrations")
@RequiredArgsConstructor
public class AdminRegistrationController {

    private final EventRepository eventRepository;
    private final RegistrationDashboardService registrationDashboardService;

    // Fetch events for the dropdown
    @GetMapping("/events")
    public List<EventOption> getEvents() {

        return eventRepository.findAll()
                .stream()
                .map(event -> new EventOption(
                        event.getEventId(),
                        event.getEventName()
                ))
                .toList();
    }

    // Fetch registration dashboard for a selected event
    @GetMapping("/{eventId}")
    public RegistrationDashboardResponse getRegistrations(
            @PathVariable UUID eventId
    ) {
        return registrationDashboardService.getEventRegistrations(eventId);
    }

    public record EventOption(
            UUID eventId,
            String eventName
    ) {}
}

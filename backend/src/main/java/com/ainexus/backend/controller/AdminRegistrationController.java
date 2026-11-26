package com.ainexus.backend.controller;

import com.ainexus.backend.dto.request.AdminManualRegistrationRequest;
import com.ainexus.backend.dto.response.RegistrationDashboardResponse;
import com.ainexus.backend.entity.Event;
import com.ainexus.backend.entity.Registration;
import com.ainexus.backend.repository.EventRepository;
import com.ainexus.backend.service.PaymentService;
import com.ainexus.backend.service.RegistrationDashboardService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/registrations")
@RequiredArgsConstructor
public class AdminRegistrationController {

    private final EventRepository eventRepository;
    private final RegistrationDashboardService registrationDashboardService;
    private final PaymentService paymentService;

    // Fetch events
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

    // Fetch registrations for an event
    @GetMapping("/{eventId}")
    public RegistrationDashboardResponse getRegistrations(
            @PathVariable UUID eventId
    ) {
        return registrationDashboardService.getEventRegistrations(eventId);
    }

    // Create manual registration
    @PostMapping("/manual")
    public ResponseEntity<?> createManualRegistration(
            @Valid @RequestBody AdminManualRegistrationRequest request
    ) {
        try {

            Registration registration =
                    paymentService.createAdminManualRegistration(request);

            String paymentStatus =
                    "VERIFIED".equalsIgnoreCase(
                            registration.getPaymentStatus()
                    )
                            ? "VERIFIED"
                            : "PENDING";

            return ResponseEntity.status(HttpStatus.CREATED).body(
                    Map.of(
                            "success", true,
                            "message", "Manual registration created successfully",
                            "registrationId", registration.getRegistrationId(),
                            "paymentStatus", paymentStatus,
                            "teamId", registration.getTeamId() == null
                                    ? ""
                                    : registration.getTeamId().toString()
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", e.getMessage()
                    )
            );
        }
    }

    public record EventOption(
            UUID eventId,
            String eventName
    ) {}
}
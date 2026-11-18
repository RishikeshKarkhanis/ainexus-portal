package com.ainexus.backend.controller;

import com.ainexus.backend.dto.response.RegisteredEventResponse;
import com.ainexus.backend.service.RegisteredEventService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/me")
public class RegisteredEventController {

    private final RegisteredEventService registeredEventService;

    public RegisteredEventController(
            RegisteredEventService registeredEventService
    ) {
        this.registeredEventService = registeredEventService;
    }

    @GetMapping("/events")
    public List<RegisteredEventResponse> getMyEvents(
            Authentication authentication
    ) {
        return registeredEventService.getRegisteredEvents(authentication);
    }
}
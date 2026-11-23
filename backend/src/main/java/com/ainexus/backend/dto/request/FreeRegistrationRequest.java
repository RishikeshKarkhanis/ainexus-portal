package com.ainexus.backend.dto.request;

import java.util.List;
import java.util.UUID;

public record FreeRegistrationRequest(
        UUID eventId,
        String teamName,
        List<UUID> memberIds
        ) {}

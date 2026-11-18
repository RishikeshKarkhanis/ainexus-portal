package com.ainexus.backend.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record RegisteredEventResponse(
        UUID eventId,
        String eventName,
        String description,
        LocalDate eventDate,
        Integer registrationFee,
        String thumbnailPath,
        LocalDateTime registrationDate,
        String teamName
) {}
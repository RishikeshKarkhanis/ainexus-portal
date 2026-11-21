package com.ainexus.backend.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record AttendanceRecordResponse(
        String name,
        String enrollmentNumber,
        UUID userId,
        String teamName,
        UUID teamId,
        String eventName,
        UUID eventId,
        LocalDateTime timestamp
) {
}


package com.ainexus.backend.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record AttendanceScanResponse(
        boolean success,
        String message,
        UUID attendanceId,
        UUID ticketId,
        String participantName,
        String participantEmail,
        String teamName,
        String eventName,
        LocalDateTime checkedInAt
) {}

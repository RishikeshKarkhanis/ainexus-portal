package com.ainexus.backend.repository;

import java.time.LocalDateTime;
import java.util.UUID;

public interface AttendanceRecordProjection {

    String getName();

    String getEnrollmentNumber();

    UUID getUserId();

    String getTeamName();

    UUID getTeamId();

    String getEventName();

    UUID getEventId();

    LocalDateTime getTimestamp();
}

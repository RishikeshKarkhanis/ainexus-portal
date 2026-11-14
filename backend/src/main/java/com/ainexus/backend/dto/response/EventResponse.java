package com.ainexus.backend.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class EventResponse {

    private UUID eventId;
    private String eventName;
    private String description;
    private LocalDate eventDate;
    private Integer registrationFee;
    private Boolean collegeOnly;
    private String registrationStatus;
    private LocalDateTime createdAt;
}
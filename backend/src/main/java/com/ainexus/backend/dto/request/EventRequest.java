package com.ainexus.backend.dto.request;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EventRequest {

    @NotBlank(message = "Event name is required")
    private String eventName;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Event date is required")
    @FutureOrPresent(message = "Event date cannot be in the past")
    private LocalDate eventDate;

    @NotNull(message = "Registration fee is required")
    @Min(value = 0, message = "Registration fee cannot be negative")
    private Integer registrationFee;

    @NotNull(message = "College-only status is required")
    private Boolean collegeOnly;

    @NotBlank(message = "Registration status is required")
    private String registrationStatus;
}
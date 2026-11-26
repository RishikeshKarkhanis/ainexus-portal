
package com.ainexus.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record FreeRegistrationRequest(

        @NotNull
        UUID eventId,

        @NotBlank
        @Size(min = 3, max = 120)
        String teamName,

        @NotNull
        List<UUID> memberIds,

        @NotBlank
        @Pattern(
                regexp = "^(?:\\+91[- ]?)?[6-9]\\d{9}$",
                message = "Enter a valid Indian mobile number"
        )
        String leaderPhoneNumber

) {}

package com.ainexus.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record CreatePaymentOrderRequest(

        @NotBlank
        String eventId,

        @NotBlank
        @Size(min = 3, max = 120)
        String teamName,

        @NotNull
        List<UUID> memberIds

) {}

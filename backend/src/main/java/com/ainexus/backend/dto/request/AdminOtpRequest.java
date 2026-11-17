package com.ainexus.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AdminOtpRequest(
        @NotNull UUID adminUserId,
        @NotBlank String adminPassword
) {}

package com.ainexus.backend.dto.response;

public record VerifyOtpResponse(
        String message,
        String resetToken
) {}

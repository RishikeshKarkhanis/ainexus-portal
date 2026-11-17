package com.ainexus.backend.dto.response;

public record AdminLoginResponse(
        String token,
        String message
) {}

package com.ainexus.backend.dto.response;

import java.util.UUID;

public record AdminUserResponse(
        UUID userId,
        String name,
        String email
) {}
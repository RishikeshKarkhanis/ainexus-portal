package com.ainexus.backend.dto.response;

import java.util.UUID;

public record AdminAccountResponse(
        UUID userId,
        String name
) {}

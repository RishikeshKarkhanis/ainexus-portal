package com.ainexus.backend.dto.response;

import java.util.UUID;

public interface UserSearchResponse {

    UUID getUserId();

    String getName();

    String getEmail();

    Boolean getAlreadyRegistered();
}
package com.ainexus.backend.service;

import com.ainexus.backend.dto.response.UserSearchResponse;
import com.ainexus.backend.entity.User;
import com.ainexus.backend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class TeamService {

    private final UserRepository userRepository;

    public TeamService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<UserSearchResponse> searchAvailableUsers(
            UUID eventId,
            String query,
            Authentication authentication) {

        if (eventId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Event ID is required"
            );
        }

        if (query == null || query.trim().length() < 2) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Search query must contain at least 2 characters"
            );
        }

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Authentication required"
            );
        }

        String email = authentication.getName();

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"
                ));

        return userRepository.searchAvailableUsers(
                eventId,
                currentUser.getUserId(),
                query.trim()
        );
    }
}

package com.ainexus.backend.controller;

import com.ainexus.backend.dto.response.UserSearchResponse;
import com.ainexus.backend.service.TeamService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    // Search available teammates for an event
    @GetMapping("/search")
    public ResponseEntity<List<UserSearchResponse>> searchAvailableUsers(
            @RequestParam UUID eventId,
            @RequestParam(name = "q") String query,
            Authentication authentication) {

        List<UserSearchResponse> users =
                teamService.searchAvailableUsers(
                        eventId,
                        query,
                        authentication
                );

        return ResponseEntity.ok(users);
    }
}

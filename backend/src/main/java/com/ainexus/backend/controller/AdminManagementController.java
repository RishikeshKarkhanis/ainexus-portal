package com.ainexus.backend.controller;

import com.ainexus.backend.dto.response.AdminUserResponse;
import com.ainexus.backend.entity.User;
import com.ainexus.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/management")
@RequiredArgsConstructor
public class AdminManagementController {

    private final UserRepository userRepository;

    @GetMapping("/admins")
    public List<AdminUserResponse> getAdmins() {
        return userRepository.findAdminUsers();
    }

    @GetMapping("/search")
    public List<AdminUserResponse> searchUsers(
            @RequestParam String q
    ) {
        if (q.trim().length() < 2) {
            return List.of();
        }

        return userRepository.searchNonAdminUsers(
                q.trim(),
                PageRequest.of(0, 10)
        );
    }

    @PatchMapping("/{userId}/promote")
    @Transactional
    public AdminUserResponse promoteUser(
            @PathVariable UUID userId
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"
                ));

        if (user.isAdmin()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "User is already an administrator"
            );
        }

        user.setAdmin(true);
        userRepository.save(user);

        return new AdminUserResponse(
                user.getUserId(),
                user.getName(),
                user.getEmail()
        );
    }
}
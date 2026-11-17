package com.ainexus.backend.controller;

import com.ainexus.backend.entity.User;
import com.ainexus.backend.repository.UserRepository;
import com.ainexus.backend.service.AdminAuthService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/auth")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AdminAuthService adminAuthService;
    private final UserRepository userRepository;

    // ==========================================
    // 1. GET ALL ADMIN ACCOUNTS
    // ==========================================

    @GetMapping("/admins")
    public ResponseEntity<List<AdminResponse>> getAdmins() {

        List<AdminResponse> admins = userRepository
                .findAll()
                .stream()
                .filter(User::isAdmin)
                .map(admin -> new AdminResponse(
                        admin.getUserId(),
                        admin.getName(),
                        admin.getEmail()
                ))
                .toList();

        return ResponseEntity.ok(admins);
    }

    // ==========================================
    // 2. REQUEST ADMIN OTP
    // ==========================================

    @PostMapping("/request-otp")
    public ResponseEntity<Map<String, String>> requestOtp(
            @Valid @RequestBody RequestOtpRequest request
    ) {

        adminAuthService.requestOtp(
                request.adminUserId(),
                request.adminPassword()
        );

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "A verification code has been sent to your registered email."
                )
        );
    }

    // ==========================================
    // 3. VERIFY ADMIN OTP
    // ==========================================

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, String>> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request
    ) {

        String token = adminAuthService.verifyOtp(
                request.adminUserId(),
                request.otp()
        );

        return ResponseEntity.ok(
                Map.of(
                        "message", "Admin verification successful.",
                        "token", token
                )
        );
    }

    // ==========================================
    // REQUEST DTOs
    // ==========================================

    public record RequestOtpRequest(
            @NotNull UUID adminUserId,
            @NotBlank String adminPassword
    ) {}

    public record VerifyOtpRequest(
            @NotNull UUID adminUserId,
            @NotBlank String otp
    ) {}

    // ==========================================
    // RESPONSE DTO
    // ==========================================

    public record AdminResponse(
            UUID userId,
            String name,
            String email
    ) {}
}

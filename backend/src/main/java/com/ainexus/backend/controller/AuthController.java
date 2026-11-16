package com.ainexus.backend.controller;

import com.ainexus.backend.dto.request.*;
import com.ainexus.backend.dto.response.*;
import com.ainexus.backend.service.AuthService;
import com.ainexus.backend.service.PasswordResetService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authService.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {
        LoginResponse response = authService.login(request);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ForgotPasswordResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {
        passwordResetService.generateAndSendOtp(request.email());

        return ResponseEntity.ok(
                new ForgotPasswordResponse(
                        "If an account exists with this email, an OTP has been sent."
                )
        );
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<VerifyOtpResponse> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request
    ) {
        String resetToken = passwordResetService.verifyOtp(
                request.email(),
                request.otp()
        );

        return ResponseEntity.ok(
                new VerifyOtpResponse(
                        "OTP verified successfully.",
                        resetToken
                )
        );
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ResetPasswordResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        passwordResetService.resetPassword(
                request.resetToken(),
                request.newPassword()
        );

        return ResponseEntity.ok(
                new ResetPasswordResponse(
                        "Password reset successfully."
                )
        );
    }
}
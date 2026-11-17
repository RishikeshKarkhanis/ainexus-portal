package com.ainexus.backend.service;

import com.ainexus.backend.entity.User;
import com.ainexus.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class AdminAuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final JwtService jwtService;

    @Value("${ADMIN_COMMON_PASSWORD}")
    private String adminPassword;

    private final SecureRandom secureRandom = new SecureRandom();

    private final Map<UUID, OtpChallenge> otpChallenges =
            new ConcurrentHashMap<>();

    // Tracks resend cooldown independently of active OTP challenges
    private final Map<UUID, LocalDateTime> lastOtpSentAt =
            new ConcurrentHashMap<>();

    private static final int MAX_ATTEMPTS = 5;
    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int RESEND_COOLDOWN_SECONDS = 60;

    // Step 1: Validate common password and send OTP
    public synchronized void requestOtp(
            UUID adminUserId,
            String adminPassword
    ) {

        User admin = userRepository.findById(adminUserId)
                .filter(User::isAdmin)
                .orElseThrow(() ->
                        new RuntimeException("Invalid administrator account")
                );

        // Validate common admin password
        if (this.adminPassword == null ||
                !this.adminPassword.equals(adminPassword)) {
            throw new RuntimeException("Invalid admin password");
        }

        LocalDateTime now = LocalDateTime.now();

        // Enforce resend cooldown
        LocalDateTime lastSent = lastOtpSentAt.get(adminUserId);

        if (lastSent != null &&
                lastSent.plusSeconds(RESEND_COOLDOWN_SECONDS).isAfter(now)) {

            throw new RuntimeException(
                    "Please wait before requesting another OTP."
            );
        }

        // Generate a cryptographically secure 6-digit OTP
        String otp = String.format(
                "%06d",
                secureRandom.nextInt(1_000_000)
        );

        // Store only the BCrypt hash
        String otpHash = passwordEncoder.encode(otp);

        OtpChallenge challenge = new OtpChallenge(
                otpHash,
                now.plusMinutes(OTP_EXPIRY_MINUTES)
        );

        // Store challenge temporarily
        otpChallenges.put(adminUserId, challenge);

        try {
            emailService.sendAdminOtp(admin.getEmail(), otp);

            // Update cooldown only after successful email delivery
            lastOtpSentAt.put(adminUserId, now);

        } catch (Exception exception) {

            otpChallenges.remove(adminUserId);

            throw new RuntimeException(
                    "Unable to send OTP. Please try again later."
            );
        }
    }

    // Step 2: Verify OTP and issue admin JWT
    public synchronized String verifyOtp(
            UUID adminUserId,
            String otp
    ) {

        OtpChallenge challenge = otpChallenges.get(adminUserId);

        if (challenge == null) {
            throw new RuntimeException(
                    "No active OTP found. Please request a new OTP."
            );
        }

        // Check OTP expiry
        if (challenge.getExpiresAt().isBefore(LocalDateTime.now())) {

            otpChallenges.remove(adminUserId);

            throw new RuntimeException(
                    "OTP has expired. Please request a new one."
            );
        }

        // Check maximum attempts
        if (challenge.getAttempts() >= MAX_ATTEMPTS) {

            otpChallenges.remove(adminUserId);

            throw new RuntimeException(
                    "Maximum attempts exceeded. Request a new OTP."
            );
        }

        // Validate OTP format
        if (otp == null || !otp.matches("\\d{6}")) {

            challenge.incrementAttempts();

            if (challenge.getAttempts() >= MAX_ATTEMPTS) {
                otpChallenges.remove(adminUserId);

                throw new RuntimeException(
                        "Maximum attempts exceeded. Request a new OTP."
                );
            }

            throw new RuntimeException("Invalid OTP.");
        }

        // Verify OTP using BCrypt
        if (!passwordEncoder.matches(otp, challenge.getOtpHash())) {

            challenge.incrementAttempts();

            if (challenge.getAttempts() >= MAX_ATTEMPTS) {
                otpChallenges.remove(adminUserId);

                throw new RuntimeException(
                        "Maximum attempts exceeded. Request a new OTP."
                );
            }

            throw new RuntimeException("Invalid OTP.");
        }

        // Recheck admin status directly from database
        User admin = userRepository.findById(adminUserId)
                .filter(User::isAdmin)
                .orElseThrow(() -> {
                    otpChallenges.remove(adminUserId);

                    return new RuntimeException(
                            "Administrator access has been revoked."
                    );
                });

        // OTP is single-use
        otpChallenges.remove(adminUserId);

        // Generate a separate admin JWT
        return jwtService.generateAdminToken(admin.getEmail());
    }

    // OTP challenge stored temporarily in memory
    private static class OtpChallenge {

        private final String otpHash;
        private final LocalDateTime expiresAt;

        private int attempts;

        public OtpChallenge(
                String otpHash,
                LocalDateTime expiresAt
        ) {
            this.otpHash = otpHash;
            this.expiresAt = expiresAt;
            this.attempts = 0;
        }

        public String getOtpHash() {
            return otpHash;
        }

        public LocalDateTime getExpiresAt() {
            return expiresAt;
        }

        public int getAttempts() {
            return attempts;
        }

        public void incrementAttempts() {
            attempts++;
        }
    }
}
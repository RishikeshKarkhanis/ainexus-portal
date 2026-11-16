package com.ainexus.backend.service;

import com.ainexus.backend.entity.PasswordResetOtp;
import com.ainexus.backend.entity.User;
import com.ainexus.backend.repository.PasswordResetOtpRepository;
import com.ainexus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Base64;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetOtpRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public void generateAndSendOtp(String email) {

        Optional<User> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {
            return;
        }

        User user = optionalUser.get();

        String otp = String.format(
                "%06d",
                secureRandom.nextInt(1_000_000)
        );

        String otpHash = passwordEncoder.encode(otp);

        PasswordResetOtp resetOtp = otpRepository
                .findByUserId(user.getUserId())
                .orElseGet(PasswordResetOtp::new);

        resetOtp.setUserId(user.getUserId());
        resetOtp.setOtpHash(otpHash);
        resetOtp.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        resetOtp.setAttempts(0);
        resetOtp.setCreatedAt(LocalDateTime.now());

        // Invalidate any previous reset token
        resetOtp.setResetTokenHash(null);
        resetOtp.setResetTokenExpiresAt(null);

        otpRepository.saveAndFlush(resetOtp);

        emailService.sendPasswordResetOtp(email, otp);
    }


    @Transactional
    public String verifyOtp(String email, String otp) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("Invalid email or OTP"));

        PasswordResetOtp resetOtp = otpRepository
                .findByUserId(user.getUserId())
                .orElseThrow(() ->
                        new RuntimeException("Invalid email or OTP"));

        // Check whether OTP has expired
        if (resetOtp.getExpiresAt().isBefore(LocalDateTime.now())) {
            otpRepository.delete(resetOtp);
            throw new RuntimeException("OTP has expired. Request a new OTP.");
        }

        // Check maximum attempts
        if (resetOtp.getAttempts() >= 5) {
            otpRepository.delete(resetOtp);
            throw new RuntimeException("Too many attempts. Request a new OTP.");
        }

        // Verify OTP using BCrypt
        if (!passwordEncoder.matches(otp, resetOtp.getOtpHash())) {

            resetOtp.setAttempts(resetOtp.getAttempts() + 1);

            if (resetOtp.getAttempts() >= 5) {
                otpRepository.delete(resetOtp);
                throw new RuntimeException(
                        "Too many attempts. Request a new OTP."
                );
            }

            otpRepository.save(resetOtp);

            throw new RuntimeException("Invalid OTP.");
        }

        // Generate a cryptographically secure reset token
        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);

        String resetToken = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(tokenBytes);

        // Store only the hash of the reset token
        resetOtp.setResetTokenHash(
                passwordEncoder.encode(resetToken)
        );

        resetOtp.setResetTokenExpiresAt(
                LocalDateTime.now().plusMinutes(10)
        );

        // Invalidate the OTP after successful verification
        resetOtp.setOtpHash("VERIFIED");
        resetOtp.setExpiresAt(LocalDateTime.now());

        otpRepository.saveAndFlush(resetOtp);

        return resetToken;
    }



    @Transactional
    public void resetPassword(String resetToken, String newPassword) {

        LocalDateTime now = LocalDateTime.now();

        PasswordResetOtp resetOtp = otpRepository.findAll()
                .stream()
                .filter(record -> record.getResetTokenHash() != null)
                .filter(record -> record.getResetTokenExpiresAt() != null)
                .filter(record -> record.getResetTokenExpiresAt().isAfter(now))
                .filter(record -> passwordEncoder.matches(
                        resetToken, record.getResetTokenHash()))
                .findFirst()
                .orElseThrow(() ->
                        new RuntimeException("Invalid or expired reset token"));

        User user = userRepository.findById(resetOtp.getUserId())
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        user.setPasswordHash(passwordEncoder.encode(newPassword));

        userRepository.save(user);

        // Invalidate the reset token and OTP record.
        otpRepository.delete(resetOtp);

        // Notify the user about the successful password change.
        emailService.sendPasswordChangedNotification(user.getEmail());
    }



}

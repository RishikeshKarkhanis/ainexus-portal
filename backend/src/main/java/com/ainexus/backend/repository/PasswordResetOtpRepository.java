package com.ainexus.backend.repository;

import com.ainexus.backend.entity.PasswordResetOtp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PasswordResetOtpRepository
        extends JpaRepository<PasswordResetOtp, UUID> {

    Optional<PasswordResetOtp> findByUserId(UUID userId);

    void deleteByUserId(UUID userId);
}

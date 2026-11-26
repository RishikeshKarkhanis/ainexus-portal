package com.ainexus.backend.repository;

import com.ainexus.backend.entity.Payment;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    boolean existsByTransId(String transId);

    Optional<Payment> findByRegistrationId(UUID registrationId);

    List<Payment> findAllByEventIdAndPaymentStatusIgnoreCase(
            UUID eventId,
            String paymentStatus
    );

    // Fetch payment while acquiring a database-level write lock.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Payment p WHERE p.paymentId = :paymentId")
    Optional<Payment> findByPaymentIdForUpdate(
            @Param("paymentId") UUID paymentId
    );
}

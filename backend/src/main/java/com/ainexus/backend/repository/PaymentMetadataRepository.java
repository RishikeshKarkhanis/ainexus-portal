package com.ainexus.backend.repository;

import com.ainexus.backend.entity.PaymentMetadata;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PaymentMetadataRepository
        extends JpaRepository<PaymentMetadata, UUID> {

    Optional<PaymentMetadata> findByPaymentId(UUID paymentId);

    boolean existsByPaymentId(UUID paymentId);
}

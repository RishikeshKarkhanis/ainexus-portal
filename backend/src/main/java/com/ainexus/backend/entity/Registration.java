package com.ainexus.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "registrations", schema = "public")
@Getter
@Setter
@NoArgsConstructor
public class Registration {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "registration_id")
    private UUID registrationId;

    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @Column(name = "team_id")
    private UUID teamId;

    @Column(name = "registration_date")
    private LocalDateTime registrationDate;

    @Column(name = "team_name")
    private String teamName;

    @Column(name = "transaction_id")
    private String transactionId;

    @Column(name = "payment_status", nullable = false, length = 20)
    private String paymentStatus;

    @PrePersist
    protected void onCreate() {
        if (registrationDate == null) {
            registrationDate = LocalDateTime.now();
        }
        if (paymentStatus == null || paymentStatus.isBlank()) {
            paymentStatus = "UNVERIFIED";
        }
    }
}

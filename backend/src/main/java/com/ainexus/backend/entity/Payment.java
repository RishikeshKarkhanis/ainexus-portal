package com.ainexus.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "payments", schema = "public")
@Getter
@Setter
@NoArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "payment_id")
    private UUID paymentId;

    @Column(name = "registration_id")
    private UUID registrationId;

    @Column(name = "payment_status", nullable = false)
    private String paymentStatus;

    @Column(name = "date", nullable = false)
    private LocalDateTime date;

    @Column(name = "trans_id", nullable = false)
    private String transId;

    @Column(name = "team_id")
    private UUID teamId;

    @Column(name = "event_id")
    private UUID eventId;

    @Column(name = "razorpay_order_id")
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id")
    private String razorpayPaymentId;

    @Column(name = "amount")
    private Long amount;

    @Column(name = "currency")
    private String currency;

    @Column(name = "verified_at")
    private OffsetDateTime verifiedAt;

    @PrePersist
    protected void onCreate() {
        if (date == null) {
            date = LocalDateTime.now();
        }
    }
}

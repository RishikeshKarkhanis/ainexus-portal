package com.ainexus.backend.controller;

import com.ainexus.backend.dto.response.PaymentVerificationResponse;
import com.ainexus.backend.entity.Registration;
import com.ainexus.backend.service.PaymentService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/payments")
@RequiredArgsConstructor
public class AdminPaymentController {

    private final PaymentService paymentService;

    // ==========================================
    // GET PENDING PAYMENTS FOR AN EVENT
    // ==========================================

    @GetMapping("/{eventId}/pending")
    public ResponseEntity<?> getPendingPayments(
            @PathVariable UUID eventId
    ) {

        try {

            List<PaymentVerificationResponse> payments =
                    paymentService.getPendingManualPaymentDetails(eventId);

            return ResponseEntity.ok(payments);

        } catch (IllegalArgumentException e) {

            return ResponseEntity.badRequest().body(
                    Map.of("message", e.getMessage())
            );

        } catch (RuntimeException e) {

            return ResponseEntity.badRequest().body(
                    Map.of("message", e.getMessage())
            );
        }
    }

    // ==========================================
    // VERIFY MANUAL UPI PAYMENT
    // ==========================================

    @PostMapping("/{paymentId}/verify")
    public ResponseEntity<?> verifyPayment(
            @PathVariable UUID paymentId
    ) {

        try {

            Registration registration =
                    paymentService.verifyManualPayment(paymentId);

            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message", "Payment verified successfully",
                            "paymentStatus", registration.getPaymentStatus(),
                            "registrationId", registration.getRegistrationId(),
                            "teamId", registration.getTeamId()
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    Map.of(
                            "success", false,
                            "message", e.getMessage()
                    )
            );
        }
    }

    // ==========================================
    // REJECT MANUAL UPI PAYMENT
    // ==========================================

    @PostMapping("/{paymentId}/reject")
    public ResponseEntity<?> rejectPayment(
            @PathVariable UUID paymentId
    ) {

        try {

            Registration registration =
                    paymentService.rejectManualPayment(paymentId);

            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message", "Payment rejected successfully",
                            "paymentStatus", registration.getPaymentStatus(),
                            "registrationId", registration.getRegistrationId()
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    Map.of(
                            "success", false,
                            "message", e.getMessage()
                    )
            );
        }
    }
}

package com.ainexus.backend.controller;

import com.ainexus.backend.dto.request.CreatePaymentOrderRequest;
import com.ainexus.backend.dto.request.VerifyPaymentRequest;
import com.ainexus.backend.dto.request.SubmitManualPaymentRequest;

import com.ainexus.backend.entity.Payment;
import com.ainexus.backend.entity.Registration;

import com.ainexus.backend.service.PaymentService;
import com.razorpay.RazorpayException;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    // ==========================================
    // CREATE RAZORPAY ORDER (LEGACY)
    // ==========================================

    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(
            @Valid @RequestBody CreatePaymentOrderRequest request,
            Authentication authentication
    ) {
        try {
            Payment payment = paymentService.createOrder(
                    request,
                    authentication
            );

            return ResponseEntity.ok(
                    Map.of(
                            "paymentId", payment.getPaymentId(),
                            "orderId", payment.getRazorpayOrderId(),
                            "amount", payment.getAmount(),
                            "currency", payment.getCurrency(),
                            "keyId", razorpayKeyId
                    )
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Invalid request: " + e.getMessage())
            );

        } catch (RazorpayException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(
                    Map.of("message", "Unable to create Razorpay order")
            );

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", e.getMessage())
            );
        }
    }

    // ==========================================
    // VERIFY RAZORPAY PAYMENT (LEGACY)
    // ==========================================

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(
            @Valid @RequestBody VerifyPaymentRequest request,
            Authentication authentication
    ) {
        try {
            Registration registration =
                    paymentService.verifyPayment(request, authentication);

            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message", "Registration completed successfully",
                            "registrationId", registration.getRegistrationId(),
                            "teamId", registration.getTeamId(),
                            "eventId", registration.getEventId()
                    )
            );

        } catch (RazorpayException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(
                    Map.of("message", "Unable to verify payment with Razorpay")
            );

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
    // SUBMIT MANUAL UPI PAYMENT
    // ==========================================

    @PostMapping("/manual")
    public ResponseEntity<?> submitManualPayment(
            @Valid @RequestBody SubmitManualPaymentRequest request,
            Authentication authentication
    ) {
        try {
            Registration registration =
                    paymentService.submitManualPayment(request, authentication);

            return ResponseEntity.status(HttpStatus.CREATED).body(
                    Map.of(
                            "success", true,
                            "message", "Payment details submitted. Awaiting admin verification.",
                            "registrationId", registration.getRegistrationId(),
                            "paymentStatus", registration.getPaymentStatus()
                    )
            );

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
}

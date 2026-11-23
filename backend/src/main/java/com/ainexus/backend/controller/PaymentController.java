package com.ainexus.backend.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ainexus.backend.dto.request.SubmitManualPaymentRequest;
import com.ainexus.backend.entity.Registration;
import com.ainexus.backend.service.PaymentService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
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
            Registration registration
                    = paymentService.submitManualPayment(request, authentication);

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

    // ==========================================
// COMPLETE FREE EVENT REGISTRATION
// ==========================================
    @PostMapping("/free-registration")
    public ResponseEntity<?> registerFreeEvent(
            @RequestBody com.ainexus.backend.dto.request.FreeRegistrationRequest request,
            Authentication authentication
    ) {
        try {
            Registration registration
                    = paymentService.registerFreeEvent(request, authentication);

            return ResponseEntity.status(HttpStatus.CREATED).body(
                    Map.of(
                            "success", true,
                            "message", "Free event registration completed successfully.",
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

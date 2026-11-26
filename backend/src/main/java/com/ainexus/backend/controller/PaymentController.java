package com.ainexus.backend.controller;

import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.AccessDeniedException;
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

    // ==========================================
    // UPLOAD PAYMENT SCREENSHOT
    // ==========================================
    @PostMapping(
            value = "/{registrationId}/screenshot",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> uploadPaymentScreenshot(
            @PathVariable UUID registrationId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {
        try {
            Registration registration = paymentService.uploadPaymentScreenshot(
                    registrationId, file, authentication
            );

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Payment screenshot uploaded. Awaiting admin verification.",
                    "registrationId", registration.getRegistrationId(),
                    "paymentStatus", registration.getPaymentStatus(),
                    "uploadedAt", registration.getPaymentScreenshotUploadedAt()
            ));
        } catch (AccessDeniedException exception) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                    Map.of("message", exception.getMessage())
            );
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", exception.getMessage())
            );
        } catch (RuntimeException exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    Map.of("message", "Unable to upload payment screenshot")
            );
        }
    }

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

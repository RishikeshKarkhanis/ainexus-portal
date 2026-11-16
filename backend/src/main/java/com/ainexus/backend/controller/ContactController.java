package com.ainexus.backend.controller;

import com.ainexus.backend.dto.request.ContactRequest;
import com.ainexus.backend.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
public class ContactController {

    private final EmailService emailService;

    @PostMapping
    public ResponseEntity<Map<String, String>> submitContactForm(
            @Valid @RequestBody ContactRequest request
    ) {

        emailService.sendContactMessage(
                request.name().trim(),
                request.email().trim(),
                request.message().trim()
        );

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Your message has been sent successfully!"
                )
        );
    }
}

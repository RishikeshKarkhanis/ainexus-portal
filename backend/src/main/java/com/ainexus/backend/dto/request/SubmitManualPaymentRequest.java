
package com.ainexus.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

import java.util.List;
import java.util.UUID;

/**
 * Request submitted by a student after completing the UPI payment.
 * Payment status and payable amount are deliberately not accepted from
 * the client; the backend determines both values.
 */
public record SubmitManualPaymentRequest(

        @NotNull
        UUID eventId,

        @NotBlank
        @Size(min = 3, max = 120)
        String teamName,

        @NotNull
        List<UUID> memberIds,

        @NotBlank
        @Size(max = 100)
        String transactionId,

        @NotBlank
        @Pattern(
                regexp = "^(?:\\+91[- ]?)?[6-9]\\d{9}$",
                message = "Enter a valid Indian mobile number"
        )
        String leaderPhoneNumber

) {}

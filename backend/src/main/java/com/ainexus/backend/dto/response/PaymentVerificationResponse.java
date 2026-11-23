package com.ainexus.backend.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record PaymentVerificationResponse(

        UUID paymentId,

        UUID registrationId,

        UUID eventId,

        String eventName,

        String teamName,

        String leaderName,

        String leaderEmail,

        List<MemberInfo> members,

        String transactionId,

        Long amount,

        String currency,

        LocalDateTime submittedAt,

        String paymentStatus

) {

    public record MemberInfo(
            UUID userId,
            String name,
            String email
    ) {}
}

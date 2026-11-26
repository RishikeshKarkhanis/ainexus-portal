package com.ainexus.backend.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record RegistrationDashboardResponse(

        UUID eventId,
        String eventName,

        long totalTeams,
        long totalParticipants,

        Long totalCollectionInPaise,

        List<TeamRegistrationRow> teamRegistrations,
        List<IndividualRegistrationRow> individualRegistrations

) {

    public record TeamRegistrationRow(
            UUID teamId,
            String teamName,

            String leaderName,
            String leaderEmail,
            String leaderPhoneNumber,

            List<MemberSummary> members,

            LocalDateTime registrationDate,

            String paymentStatus,
            String transactionId,
            Long amountInPaise
    ) {}

    public record MemberSummary(
            UUID userId,
            String name,
            String email
    ) {}

    public record IndividualRegistrationRow(
            UUID userId,
            String name,
            String email,

            UUID teamId,
            String teamName,
            boolean teamLeader,

            LocalDateTime registrationDate,

            String paymentStatus,
            String transactionId,
            Long teamAmountInPaise
    ) {}
}
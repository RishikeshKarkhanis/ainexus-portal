package com.ainexus.backend.service;

import com.ainexus.backend.dto.response.RegistrationDashboardResponse;
import com.ainexus.backend.entity.*;
import com.ainexus.backend.repository.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RegistrationDashboardService {

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;

    @Transactional(readOnly = true)
    public RegistrationDashboardResponse getEventRegistrations(UUID eventId) {

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        List<Registration> registrations =
                registrationRepository.findAllByEventId(eventId);

        List<Team> teams = teamRepository.findAllByEventId(eventId);

        List<Payment> verifiedPayments =
                paymentRepository.findAllByEventIdAndPaymentStatusIgnoreCase(
                        eventId, "VERIFIED"
                );

        // Calculate collection from verified payments only.
        long totalCollection = verifiedPayments.stream()
                .mapToLong(payment ->
                        payment.getAmount() == null ? 0L : payment.getAmount()
                )
                .sum();

        // Keep the latest verified payment for each team for display.
        Map<UUID, Payment> paymentByTeam = new HashMap<>();

        for (Payment payment : verifiedPayments) {
            if (payment.getTeamId() == null) continue;

            Payment existing = paymentByTeam.get(payment.getTeamId());

            if (existing == null ||
                    (payment.getVerifiedAt() != null &&
                            (existing.getVerifiedAt() == null ||
                                    payment.getVerifiedAt().isAfter(existing.getVerifiedAt())))) {

                paymentByTeam.put(payment.getTeamId(), payment);
            }
        }

        Map<UUID, Team> teamById = teams.stream()
                .collect(Collectors.toMap(Team::getTeamId, team -> team));

        List<RegistrationDashboardResponse.TeamRegistrationRow> teamRows =
                new ArrayList<>();

        List<RegistrationDashboardResponse.IndividualRegistrationRow>
                individualRows = new ArrayList<>();

        long totalParticipants = 0;

        for (Registration registration : registrations) {

            UUID teamId = registration.getTeamId();

            if (teamId == null) continue;

            Team team = teamById.get(teamId);

            if (team == null) continue;

            User leader = userRepository.findById(team.getLeaderId())
                    .orElse(null);

            List<TeamMember> teamMembers =
                    teamMemberRepository.findAllByTeamId(teamId);

            List<UUID> userIds = teamMembers.stream()
                    .map(TeamMember::getUserId)
                    .toList();

            Map<UUID, User> usersById = userRepository.findAllById(userIds)
                    .stream()
                    .collect(Collectors.toMap(User::getUserId, user -> user));

            List<RegistrationDashboardResponse.MemberSummary> members =
                    new ArrayList<>();

            for (TeamMember teamMember : teamMembers) {

                User user = usersById.get(teamMember.getUserId());

                if (user == null) continue;

                members.add(
                        new RegistrationDashboardResponse.MemberSummary(
                                user.getUserId(),
                                user.getName(),
                                user.getEmail()
                        )
                );

                individualRows.add(
                        new RegistrationDashboardResponse.IndividualRegistrationRow(
                                user.getUserId(),
                                user.getName(),
                                user.getEmail(),
                                teamId,
                                team.getTeamName(),
                                user.getUserId().equals(team.getLeaderId()),
                                registration.getRegistrationDate(),
                                "VERIFIED",
                                registration.getTransactionId(),
                                paymentByTeam.containsKey(teamId)
                                        ? paymentByTeam.get(teamId).getAmount()
                                        : null
                        )
                );
            }

            totalParticipants += members.size();

            Payment payment = paymentByTeam.get(teamId);

            teamRows.add(
                    new RegistrationDashboardResponse.TeamRegistrationRow(
                            teamId,
                            registration.getTeamName() != null
                                    ? registration.getTeamName()
                                    : team.getTeamName(),
                            leader != null ? leader.getName() : "Unknown",
                            leader != null ? leader.getEmail() : "",
                            members,
                            registration.getRegistrationDate(),
                            payment != null ? payment.getPaymentStatus() : "NOT FOUND",
                            payment != null ? payment.getTransId()
                                    : registration.getTransactionId(),
                            payment != null ? payment.getAmount() : null
                    )
            );
        }

        return new RegistrationDashboardResponse(
                event.getEventId(),
                event.getEventName(),
                teamRows.size(),
                totalParticipants,
                totalCollection,
                teamRows,
                individualRows
        );
    }
}

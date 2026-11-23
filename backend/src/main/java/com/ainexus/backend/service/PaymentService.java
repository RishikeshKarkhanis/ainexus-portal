
package com.ainexus.backend.service;

import com.ainexus.backend.dto.request.SubmitManualPaymentRequest;
import com.ainexus.backend.dto.response.PaymentVerificationResponse;

import com.ainexus.backend.entity.Event;
import com.ainexus.backend.entity.Payment;
import com.ainexus.backend.entity.PaymentMetadata;
import com.ainexus.backend.entity.Registration;
import com.ainexus.backend.entity.Team;
import com.ainexus.backend.entity.TeamMember;
import com.ainexus.backend.entity.Ticket;
import com.ainexus.backend.entity.User;

import com.ainexus.backend.repository.EventRepository;
import com.ainexus.backend.repository.PaymentRepository;
import com.ainexus.backend.repository.PaymentMetadataRepository;
import com.ainexus.backend.repository.RegistrationRepository;
import com.ainexus.backend.repository.TeamRepository;
import com.ainexus.backend.repository.TeamMemberRepository;
import com.ainexus.backend.repository.TicketRepository;
import com.ainexus.backend.repository.UserRepository;



import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;


import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;

@Service
public class PaymentService {

    private static final Logger LOGGER =
            Logger.getLogger(PaymentService.class.getName());

    private final EventRepository eventRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentMetadataRepository paymentMetadataRepository;
    private final RegistrationRepository registrationRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final HallTicketService hallTicketService;


    public PaymentService(
            EventRepository eventRepository,
            PaymentRepository paymentRepository,
            PaymentMetadataRepository paymentMetadataRepository,
            RegistrationRepository registrationRepository,
            TeamRepository teamRepository,
            TeamMemberRepository teamMemberRepository,
            TicketRepository ticketRepository,
            UserRepository userRepository,
            EmailService emailService,
            HallTicketService hallTicketService
    ) {
        this.eventRepository = eventRepository;
        this.paymentRepository = paymentRepository;
        this.paymentMetadataRepository = paymentMetadataRepository;
        this.registrationRepository = registrationRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.hallTicketService = hallTicketService;
    }

    // ==========================================
    // 1. SUBMIT MANUAL UPI PAYMENT
    // ==========================================

    @Transactional
    public Registration submitManualPayment(
            SubmitManualPaymentRequest request,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Authentication required");
        }

        User leader = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        UUID eventId = request.eventId();
        UUID leaderId = leader.getUserId();

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!"OPEN".equalsIgnoreCase(event.getRegistrationStatus())) {
            throw new RuntimeException("Event registration is closed");
        }

        if (event.getRegistrationFee() == null ||
                event.getRegistrationFee() <= 0) {
            throw new RuntimeException("Invalid registration fee");
        }

        String teamName = request.teamName() == null
                ? "" : request.teamName().trim();

        if (teamName.length() < 3 || teamName.length() > 120) {
            throw new RuntimeException(
                    "Team name must be between 3 and 120 characters"
            );
        }

        String transactionId = request.transactionId() == null
                ? ""
                : request.transactionId()
                .trim()
                .toUpperCase(java.util.Locale.ROOT);

        if (transactionId.isBlank() || transactionId.length() > 100) {
            throw new RuntimeException(
                    "A valid UPI transaction ID is required"
            );
        }

        if (paymentRepository.existsByTransId(transactionId)) {
            throw new RuntimeException(
                    "This transaction ID has already been submitted"
            );
        }

        List<UUID> memberIds = request.memberIds();

        if (memberIds == null) {
            throw new RuntimeException("Team members are required");
        }

        Set<UUID> uniqueMemberIds = new HashSet<>(memberIds);

        if (uniqueMemberIds.size() != memberIds.size()) {
            throw new RuntimeException("Duplicate members are not allowed");
        }

        if (uniqueMemberIds.contains(leaderId)) {
            throw new RuntimeException(
                    "Team leader cannot be selected again"
            );
        }

        int totalTeamSize = memberIds.size() + 1;

        if (totalTeamSize < event.getMinTeamSize() ||
                totalTeamSize > event.getMaxTeamSize()) {
            throw new RuntimeException("Invalid team size");
        }

        List<User> selectedUsers = userRepository.findAllById(memberIds);

        if (selectedUsers.size() != memberIds.size()) {
            throw new RuntimeException(
                    "One or more selected users do not exist"
            );
        }

        validateMemberEligibility(eventId, leaderId, memberIds);

        // Create pending registration.
        Registration registration = new Registration();
        registration.setEventId(eventId);
        registration.setTeamName(teamName);
        registration.setTransactionId(transactionId);
        registration.setPaymentStatus("UNVERIFIED");

        registration = registrationRepository.save(registration);

        // Create pending payment.
        Payment payment = new Payment();
        payment.setRegistrationId(registration.getRegistrationId());
        payment.setEventId(eventId);
        payment.setPaymentStatus("UNVERIFIED");
        payment.setTransId(transactionId);
        payment.setAmount(
                Math.multiplyExact(event.getRegistrationFee().longValue(), 100L)
        );
        payment.setCurrency("INR");

        payment = paymentRepository.save(payment);

        // Save team metadata.
        PaymentMetadata metadata = new PaymentMetadata();
        metadata.setPaymentId(payment.getPaymentId());
        metadata.setLeaderId(leaderId);
        metadata.setTeamName(teamName);
        metadata.setMemberIds(memberIds.toArray(new UUID[0]));

        paymentMetadataRepository.save(metadata);

        return registration;
    }

    // ==========================================
    // 2. ADMIN: FETCH PENDING MANUAL PAYMENTS
    // ==========================================

    @Transactional(readOnly = true)
    public List<Payment> getPendingManualPayments(UUID eventId) {

        if (eventId == null) {
            throw new IllegalArgumentException("Event ID is required");
        }

        return paymentRepository.findAllByEventIdAndPaymentStatusIgnoreCase(
                eventId,
                "UNVERIFIED"
        );
    }


    @Transactional(readOnly = true)
    public List<PaymentVerificationResponse> getPendingManualPaymentDetails(
            UUID eventId
    ) {

        if (eventId == null) {
            throw new IllegalArgumentException("Event ID is required");
        }

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        List<Payment> pendingPayments =
                paymentRepository.findAllByEventIdAndPaymentStatusIgnoreCase(
                        eventId,
                        "UNVERIFIED"
                );

        List<PaymentVerificationResponse> responses = new ArrayList<>();

        for (Payment payment : pendingPayments) {

            PaymentMetadata metadata = paymentMetadataRepository
                    .findByPaymentId(payment.getPaymentId())
                    .orElseThrow(() -> new RuntimeException(
                            "Payment metadata not found for payment: "
                                    + payment.getPaymentId()
                    ));

            User leader = userRepository.findById(metadata.getLeaderId())
                    .orElseThrow(() -> new RuntimeException(
                            "Team leader not found"
                    ));

            UUID[] memberIds = metadata.getMemberIds();

            List<User> users = memberIds == null
                    ? List.of()
                    : userRepository.findAllById(List.of(memberIds));

            List<PaymentVerificationResponse.MemberInfo> members =
                    users.stream()
                            .map(user ->
                                    new PaymentVerificationResponse.MemberInfo(
                                            user.getUserId(),
                                            user.getName(),
                                            user.getEmail()
                                    )
                            )
                            .toList();

            Registration registration = registrationRepository
                    .findById(payment.getRegistrationId())
                    .orElseThrow(() -> new RuntimeException(
                            "Registration not found"
                    ));

            responses.add(
                    new PaymentVerificationResponse(
                            payment.getPaymentId(),
                            registration.getRegistrationId(),
                            event.getEventId(),
                            event.getEventName(),
                            metadata.getTeamName(),
                            leader.getName(),
                            leader.getEmail(),
                            members,
                            payment.getTransId(),
                            payment.getAmount(),
                            payment.getCurrency(),
                            payment.getDate(),
                            payment.getPaymentStatus()
                    )
            );
        }

        return responses;
    }


    // ==========================================
    // 3. ADMIN: VERIFY MANUAL UPI PAYMENT
    // ==========================================

    @Transactional
    public Registration verifyManualPayment(UUID paymentId) {

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        // Idempotency check.
        if ("VERIFIED".equalsIgnoreCase(payment.getPaymentStatus())) {

            if (payment.getRegistrationId() == null) {
                throw new RuntimeException(
                        "Verified payment has no registration"
                );
            }

            return registrationRepository.findById(payment.getRegistrationId())
                    .orElseThrow(() -> new RuntimeException(
                            "Registration not found"
                    ));
        }

        if (!"UNVERIFIED".equalsIgnoreCase(payment.getPaymentStatus())) {
            throw new RuntimeException(
                    "Only unverified manual payments can be approved"
            );
        }

        if (payment.getEventId() == null ||
                payment.getRegistrationId() == null) {
            throw new RuntimeException(
                    "Payment is missing its event or registration reference"
            );
        }

        PaymentMetadata metadata = paymentMetadataRepository
                .findByPaymentId(paymentId)
                .orElseThrow(() -> new RuntimeException(
                        "Payment metadata not found"
                ));

        Registration registration = registrationRepository
                .findById(payment.getRegistrationId())
                .orElseThrow(() -> new RuntimeException(
                        "Pending registration not found"
                ));

        if (!"UNVERIFIED".equalsIgnoreCase(registration.getPaymentStatus())) {
            throw new RuntimeException(
                    "Registration is no longer pending verification"
            );
        }

        Event event = eventRepository.findById(payment.getEventId())
                .orElseThrow(() -> new RuntimeException("Event not found"));

        // Validate stored payment amount.
        if (payment.getAmount() == null ||
                event.getRegistrationFee() == null) {
            throw new RuntimeException(
                    "Payment amount or event fee is missing"
            );
        }

        long expectedAmount = Math.multiplyExact(
                event.getRegistrationFee().longValue(),
                100L
        );

        if (payment.getAmount() != expectedAmount ||
                !"INR".equalsIgnoreCase(payment.getCurrency())) {
            throw new RuntimeException(
                    "Stored payment amount does not match the event fee"
            );
        }

        UUID[] memberArray = metadata.getMemberIds();

        if (memberArray == null) {
            throw new RuntimeException(
                    "Team member information is missing"
            );
        }

        List<UUID> memberIds = List.of(memberArray);
        UUID leaderId = metadata.getLeaderId();

        if (leaderId == null) {
            throw new RuntimeException(
                    "Team leader information is missing"
            );
        }

        int totalTeamSize = memberIds.size() + 1;

        if (totalTeamSize < event.getMinTeamSize() ||
                totalTeamSize > event.getMaxTeamSize()) {
            throw new RuntimeException(
                    "Team size is no longer valid for this event"
            );
        }

        // Recheck confirmed and pending registrations.
        validateMemberEligibility(
                payment.getEventId(),
                leaderId,
                memberIds,
                paymentId
        );

        User leader = userRepository.findById(leaderId)
                .orElseThrow(() -> new RuntimeException(
                        "Team leader not found"
                ));

        List<User> selectedUsers = userRepository.findAllById(memberIds);

        if (selectedUsers.size() != memberIds.size()) {
            throw new RuntimeException(
                    "One or more selected team members no longer exist"
            );
        }

        // Create team.
        Team team = new Team();
        team.setTeamName(metadata.getTeamName());
        team.setEventId(payment.getEventId());
        team.setLeaderId(leaderId);

        team = teamRepository.save(team);

        List<RegistrationEmail> registrationEmails = new ArrayList<>();

        // Create leader membership and ticket.
        TeamMember leaderMember = new TeamMember();
        leaderMember.setTeamId(team.getTeamId());
        leaderMember.setUserId(leader.getUserId());

        leaderMember = teamMemberRepository.save(leaderMember);

        Ticket leaderTicket = createTicket(leaderMember);

        registrationEmails.add(
                new RegistrationEmail(
                        leader.getName(),
                        leader.getEmail(),
                        leaderTicket.getQrToken()
                )
        );

        // Create teammates and their tickets.
        for (User user : selectedUsers) {

            TeamMember teamMember = new TeamMember();
            teamMember.setTeamId(team.getTeamId());
            teamMember.setUserId(user.getUserId());

            teamMember = teamMemberRepository.save(teamMember);

            Ticket ticket = createTicket(teamMember);

            registrationEmails.add(
                    new RegistrationEmail(
                            user.getName(),
                            user.getEmail(),
                            ticket.getQrToken()
                    )
            );
        }

        // Update existing pending registration.
        registration.setTeamId(team.getTeamId());
        registration.setTeamName(metadata.getTeamName());
        registration.setPaymentStatus("VERIFIED");

        registrationRepository.save(registration);

        // Update payment.
        payment.setTeamId(team.getTeamId());
        payment.setPaymentStatus("VERIFIED");
        payment.setVerifiedAt(OffsetDateTime.now());

        paymentRepository.save(payment);

        // Send hall tickets after transaction commits.
        scheduleRegistrationEmails(
                registrationEmails,
                event,
                metadata.getTeamName()
        );

        return registration;
    }

    // ==========================================
    // 4. ADMIN: REJECT MANUAL UPI PAYMENT
    // ==========================================

    @Transactional
    public Registration rejectManualPayment(UUID paymentId) {

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (!"UNVERIFIED".equalsIgnoreCase(payment.getPaymentStatus())) {
            throw new RuntimeException(
                    "Only unverified manual payments can be rejected"
            );
        }

        if (payment.getRegistrationId() == null) {
            throw new RuntimeException(
                    "Payment has no associated registration"
            );
        }

        Registration registration = registrationRepository
                .findById(payment.getRegistrationId())
                .orElseThrow(() -> new RuntimeException(
                        "Registration not found"
                ));

        if (!"UNVERIFIED".equalsIgnoreCase(registration.getPaymentStatus())) {
            throw new RuntimeException(
                    "Registration is no longer pending verification"
            );
        }

        payment.setPaymentStatus("REJECTED");
        paymentRepository.save(payment);

        registration.setPaymentStatus("REJECTED");
        registrationRepository.save(registration);

        return registration;
    }

    // ==========================================
    // 7. CHECK MEMBER ELIGIBILITY
    // ==========================================

    private void validateMemberEligibility(
            UUID eventId,
            UUID leaderId,
            List<UUID> memberIds
    ) {
        validateMemberEligibility(
                eventId,
                leaderId,
                memberIds,
                null
        );
    }

    private void validateMemberEligibility(
            UUID eventId,
            UUID leaderId,
            List<UUID> memberIds,
            UUID excludedPaymentId
    ) {

        Set<UUID> registeredUserIds = new HashSet<>();

        // Confirmed teams.
        List<Team> existingTeams =
                teamRepository.findAllByEventId(eventId);

        for (Team existingTeam : existingTeams) {

            registeredUserIds.add(existingTeam.getLeaderId());

            List<TeamMember> existingMembers =
                    teamMemberRepository.findAllByTeamId(
                            existingTeam.getTeamId()
                    );

            for (TeamMember member : existingMembers) {
                registeredUserIds.add(member.getUserId());
            }
        }

        // Other pending manual-payment submissions.
        List<Payment> pendingPayments =
                paymentRepository.findAllByEventIdAndPaymentStatusIgnoreCase(
                        eventId,
                        "UNVERIFIED"
                );

        for (Payment pendingPayment : pendingPayments) {

            if (excludedPaymentId != null &&
                    excludedPaymentId.equals(pendingPayment.getPaymentId())) {
                continue;
            }

            paymentMetadataRepository
                    .findByPaymentId(pendingPayment.getPaymentId())
                    .ifPresent(metadata -> {

                        if (metadata.getLeaderId() != null) {
                            registeredUserIds.add(metadata.getLeaderId());
                        }

                        UUID[] pendingMemberIds = metadata.getMemberIds();

                        if (pendingMemberIds != null) {
                            for (UUID pendingMemberId : pendingMemberIds) {
                                registeredUserIds.add(pendingMemberId);
                            }
                        }
                    });
        }

        if (registeredUserIds.contains(leaderId)) {
            throw new RuntimeException(
                    "You or one of the selected participants already has a confirmed or pending registration for this event"
            );
        }

        for (UUID memberId : memberIds) {

            if (registeredUserIds.contains(memberId)) {
                throw new RuntimeException(
                        "One or more selected users already have a confirmed or pending registration for this event"
                );
            }
        }
    }

    // ==========================================
    // 8. GENERATE INDIVIDUAL TICKET
    // ==========================================

    private Ticket createTicket(TeamMember teamMember) {

        Ticket ticket = new Ticket();

        ticket.setTeamMemberId(teamMember.getTeamMemberId());
        ticket.setQrToken(UUID.randomUUID().toString());

        return ticketRepository.save(ticket);
    }

    // ==========================================
    // 9. SEND HALL TICKET EMAILS AFTER COMMIT
    // ==========================================

    private void scheduleRegistrationEmails(
            List<RegistrationEmail> recipients,
            Event event,
            String teamName
    ) {

        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            throw new IllegalStateException(
                    "No active transaction synchronization"
            );
        }

        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {

                    @Override
                    public void afterCommit() {

                        for (RegistrationEmail recipient : recipients) {

                            try {

                                byte[] pdfBytes =
                                        hallTicketService.generateHallTicket(
                                                recipient.ticketCode()
                                        );

                                emailService.sendRegistrationConfirmationWithAttachment(
                                        recipient.name(),
                                        recipient.email(),
                                        event.getEventName(),
                                        event.getEventDate().toString(),
                                        teamName,
                                        recipient.ticketCode(),
                                        pdfBytes
                                );

                            } catch (Exception exception) {

                                LOGGER.log(
                                        Level.SEVERE,
                                        "Failed to generate/send hall ticket to "
                                                + recipient.email(),
                                        exception
                                );
                            }
                        }
                    }
                }
        );
    }

    private record RegistrationEmail(
            String name,
            String email,
            String ticketCode
    ) {}

}
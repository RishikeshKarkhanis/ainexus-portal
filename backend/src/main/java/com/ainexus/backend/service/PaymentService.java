
package com.ainexus.backend.service;

import com.ainexus.backend.dto.request.CreatePaymentOrderRequest;
import com.ainexus.backend.dto.request.VerifyPaymentRequest;

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

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;

import org.json.JSONObject;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
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

    private final RazorpayClient razorpayClient;
    private final EventRepository eventRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentMetadataRepository paymentMetadataRepository;
    private final RegistrationRepository registrationRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    public PaymentService(
            RazorpayClient razorpayClient,
            EventRepository eventRepository,
            PaymentRepository paymentRepository,
            PaymentMetadataRepository paymentMetadataRepository,
            RegistrationRepository registrationRepository,
            TeamRepository teamRepository,
            TeamMemberRepository teamMemberRepository,
            TicketRepository ticketRepository,
            UserRepository userRepository,
            EmailService emailService
    ) {
        this.razorpayClient = razorpayClient;
        this.eventRepository = eventRepository;
        this.paymentRepository = paymentRepository;
        this.paymentMetadataRepository = paymentMetadataRepository;
        this.registrationRepository = registrationRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    // ==========================================
    // 1. CREATE RAZORPAY ORDER
    // ==========================================

    @Transactional
    public Payment createOrder(
            CreatePaymentOrderRequest request,
            Authentication authentication
    ) throws RazorpayException {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Authentication required");
        }

        UUID eventId = UUID.fromString(request.eventId());

        User leader = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

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

        String teamName = request.teamName().trim();

        if (teamName.length() < 3 || teamName.length() > 120) {
            throw new RuntimeException(
                    "Team name must be between 3 and 120 characters"
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

        long amountInPaise = Math.multiplyExact(
                event.getRegistrationFee().longValue(),
                100L
        );

        String receipt = "evt_" + UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 20);

        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amountInPaise);
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", receipt);

        Order order = razorpayClient.orders.create(orderRequest);

        Payment payment = new Payment();

        payment.setEventId(eventId);
        payment.setPaymentStatus("CREATED");
        payment.setTransId(order.get("id"));
        payment.setRazorpayOrderId(order.get("id"));
        payment.setAmount(amountInPaise);
        payment.setCurrency("INR");

        payment = paymentRepository.save(payment);

        PaymentMetadata metadata = new PaymentMetadata();

        metadata.setPaymentId(payment.getPaymentId());
        metadata.setLeaderId(leaderId);
        metadata.setTeamName(teamName);
        metadata.setMemberIds(memberIds.toArray(new UUID[0]));

        paymentMetadataRepository.save(metadata);

        return payment;
    }

    // ==========================================
    // 2. VERIFY RAZORPAY PAYMENT
    // ==========================================

    @Transactional
    public Registration verifyPayment(
            VerifyPaymentRequest request,
            Authentication authentication
    ) throws RazorpayException {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Authentication required");
        }

        Payment payment = paymentRepository
                .findByRazorpayOrderId(request.razorpayOrderId())
                .orElseThrow(() -> new RuntimeException(
                        "Payment order not found"
                ));

        // Verify Razorpay signature.
        String generatedSignature = generateSignature(
                request.razorpayOrderId(),
                request.razorpayPaymentId()
        );

        boolean signatureValid = MessageDigest.isEqual(
                generatedSignature.getBytes(StandardCharsets.UTF_8),
                request.razorpaySignature().getBytes(StandardCharsets.UTF_8)
        );

        if (!signatureValid) {
            throw new RuntimeException("Invalid payment signature");
        }

        // Load metadata before idempotency check so that
        // the caller's identity can be checked in both cases.
        PaymentMetadata metadata = paymentMetadataRepository
                .findByPaymentId(payment.getPaymentId())
                .orElseThrow(() -> new RuntimeException(
                        "Payment metadata not found"
                ));

        // Only the leader who created this order can verify it.
        User authenticatedUser = userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!authenticatedUser.getUserId().equals(metadata.getLeaderId())) {
            throw new RuntimeException(
                    "You are not authorized to verify this payment"
            );
        }

        // Idempotency: don't create registration twice.
        if ("VERIFIED".equalsIgnoreCase(payment.getPaymentStatus())) {

            if (payment.getRegistrationId() == null) {
                throw new RuntimeException(
                        "Verified payment has no registration"
                );
            }

            return registrationRepository
                    .findById(payment.getRegistrationId())
                    .orElseThrow(() -> new RuntimeException(
                            "Registration not found"
                    ));
        }

        if (!"CREATED".equalsIgnoreCase(payment.getPaymentStatus())) {
            throw new RuntimeException("Payment cannot be verified");
        }

        // Fetch payment directly from Razorpay.
        com.razorpay.Payment razorpayPayment =
                razorpayClient.payments.fetch(
                        request.razorpayPaymentId()
                );

        // Verify order association.
        String razorpayOrderId = razorpayPayment.get("order_id");

        if (!request.razorpayOrderId().equals(razorpayOrderId)) {
            throw new RuntimeException(
                    "Payment does not belong to this order"
            );
        }

        // Verify captured status.
        String razorpayStatus = razorpayPayment.get("status");

        if (!"captured".equalsIgnoreCase(razorpayStatus)) {
            throw new RuntimeException(
                    "Payment has not been captured"
            );
        }

        // Verify amount.
        Number paidAmount = (Number) razorpayPayment.get("amount");

        if (paidAmount == null ||
                paidAmount.longValue() != payment.getAmount()) {
            throw new RuntimeException("Payment amount mismatch");
        }

        // Verify currency.
        String paidCurrency = razorpayPayment.get("currency");

        if (!payment.getCurrency().equals(paidCurrency)) {
            throw new RuntimeException("Payment currency mismatch");
        }

        UUID eventId = payment.getEventId();
        UUID leaderId = metadata.getLeaderId();

        UUID[] memberArray = metadata.getMemberIds();

        if (memberArray == null) {
            throw new RuntimeException("Team member information missing");
        }

        List<UUID> memberIds = List.of(memberArray);

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        int totalTeamSize = memberIds.size() + 1;

        if (totalTeamSize < event.getMinTeamSize() ||
                totalTeamSize > event.getMaxTeamSize()) {
            throw new RuntimeException("Invalid team size");
        }

        // Recheck eligibility before final registration.
        validateMemberEligibility(eventId, leaderId, memberIds);

        User leader = userRepository.findById(leaderId)
                .orElseThrow(() -> new RuntimeException(
                        "Team leader not found"
                ));

        List<User> selectedUsers = userRepository.findAllById(memberIds);

        if (selectedUsers.size() != memberIds.size()) {
            throw new RuntimeException(
                    "One or more team members no longer exist"
            );
        }

        // ==========================================
        // 3. CREATE TEAM
        // ==========================================

        Team team = new Team();

        team.setTeamName(metadata.getTeamName());
        team.setEventId(eventId);
        team.setLeaderId(leaderId);

        team = teamRepository.save(team);

        // Collect email details until the transaction commits.
        List<RegistrationEmail> registrationEmails = new ArrayList<>();

        // ==========================================
        // 4. CREATE TEAM MEMBERS AND TICKETS
        // ==========================================

        // Add leader.
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

        // Add selected teammates.
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

        // ==========================================
        // 5. CREATE REGISTRATION
        // ==========================================

        Registration registration = new Registration();

        registration.setEventId(eventId);
        registration.setTeamId(team.getTeamId());
        registration.setTeamName(metadata.getTeamName());
        registration.setTransactionId(request.razorpayPaymentId());

        registration = registrationRepository.save(registration);

        // ==========================================
        // 6. UPDATE PAYMENT
        // ==========================================

        payment.setPaymentStatus("VERIFIED");
        payment.setRazorpayPaymentId(request.razorpayPaymentId());
        payment.setTransId(request.razorpayPaymentId());
        payment.setTeamId(team.getTeamId());
        payment.setRegistrationId(registration.getRegistrationId());
        payment.setVerifiedAt(OffsetDateTime.now());

        paymentRepository.save(payment);

        // Emails are sent only after the database transaction commits.
        scheduleRegistrationEmails(
                registrationEmails,
                event,
                metadata.getTeamName()
        );

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

        List<Team> existingTeams =
                teamRepository.findAllByEventId(eventId);

        Set<UUID> registeredUserIds = new HashSet<>();

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

        if (registeredUserIds.contains(leaderId)) {
            throw new RuntimeException(
                    "You are already registered for this event"
            );
        }

        for (UUID memberId : memberIds) {

            if (registeredUserIds.contains(memberId)) {
                throw new RuntimeException(
                        "One or more selected users are already registered"
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
    // 9. SEND REGISTRATION EMAILS AFTER COMMIT
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
                                emailService.sendRegistrationConfirmation(
                                        recipient.name(),
                                        recipient.email(),
                                        event.getEventName(),
                                        event.getEventDate().toString(),
                                        teamName,
                                        recipient.ticketCode()
                                );

                            } catch (Exception exception) {

                                LOGGER.log(
                                        Level.SEVERE,
                                        "Failed to send registration email to "
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

    // ==========================================
    // 10. GENERATE RAZORPAY HMAC SIGNATURE
    // ==========================================

    private String generateSignature(
            String orderId,
            String paymentId
    ) {

        try {

            String payload = orderId + "|" + paymentId;

            Mac mac = Mac.getInstance("HmacSHA256");

            SecretKeySpec secretKey = new SecretKeySpec(
                    razorpayKeySecret.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            );

            mac.init(secretKey);

            byte[] hash = mac.doFinal(
                    payload.getBytes(StandardCharsets.UTF_8)
            );

            return java.util.HexFormat.of().formatHex(hash);

        } catch (Exception exception) {

            throw new RuntimeException(
                    "Unable to verify payment signature",
                    exception
            );
        }
    }
}

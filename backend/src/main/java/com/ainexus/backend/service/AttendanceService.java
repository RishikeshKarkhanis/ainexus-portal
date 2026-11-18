
package com.ainexus.backend.service;

import com.ainexus.backend.dto.request.AttendanceScanRequest;
import com.ainexus.backend.dto.response.AttendanceScanResponse;

import com.ainexus.backend.entity.Attendance;
import com.ainexus.backend.entity.Event;
import com.ainexus.backend.entity.Team;
import com.ainexus.backend.entity.TeamMember;
import com.ainexus.backend.entity.Ticket;
import com.ainexus.backend.entity.User;

import com.ainexus.backend.repository.AttendanceRepository;
import com.ainexus.backend.repository.EventRepository;
import com.ainexus.backend.repository.TeamMemberRepository;
import com.ainexus.backend.repository.TeamRepository;
import com.ainexus.backend.repository.TicketRepository;
import com.ainexus.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final TicketRepository ticketRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;

    // ==========================================
    // SCAN QR AND MARK ATTENDANCE
    // ==========================================

    @Transactional
    public AttendanceScanResponse scanAndMarkAttendance(
            AttendanceScanRequest request,
            String adminEmail
    ) {

        // 1. Validate input.
        if (request == null ||
                request.qrToken() == null ||
                request.qrToken().isBlank()) {

            throw new IllegalArgumentException(
                    "QR token is required"
            );
        }

        String qrToken = request.qrToken().trim();

        // 2. Verify authenticated admin.
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Admin account not found"
                ));

        if (!admin.isAdmin()) {
            throw new SecurityException(
                    "Only administrators can mark attendance"
            );
        }

        // 3. Find ticket using QR token.
        Ticket ticket = ticketRepository.findByQrToken(qrToken)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Invalid QR code. Ticket not found."
                ));

        // 4. Check whether ticket was already scanned.
        if (attendanceRepository.existsByTicketId(
                ticket.getTicketId()
        )) {

            throw new IllegalStateException(
                    "This participant has already checked in."
            );
        }

        // 5. Find team member.
        TeamMember teamMember = teamMemberRepository
                .findById(ticket.getTeamMemberId())
                .orElseThrow(() -> new IllegalStateException(
                        "Ticket is not linked to a valid participant."
                ));

        // 6. Find participant.
        User participant = userRepository
                .findById(teamMember.getUserId())
                .orElseThrow(() -> new IllegalStateException(
                        "Participant not found."
                ));

        // 7. Find team.
        Team team = teamRepository
                .findById(teamMember.getTeamId())
                .orElseThrow(() -> new IllegalStateException(
                        "Team not found."
                ));

        // 8. Find event.
        Event event = eventRepository
                .findById(team.getEventId())
                .orElseThrow(() -> new IllegalStateException(
                        "Event not found."
                ));

        // 9. Create attendance record.
        Attendance attendance = new Attendance();

        attendance.setTicketId(ticket.getTicketId());
        attendance.setTeamMemberId(teamMember.getTeamMemberId());
        attendance.setEventId(event.getEventId());
        attendance.setScannedBy(admin.getUserId());

        try {

            attendance = attendanceRepository.saveAndFlush(attendance);

        } catch (DataIntegrityViolationException exception) {

            // Handles simultaneous scans of the same QR code.
            throw new IllegalStateException(
                    "This participant has already checked in."
            );
        }

        // 10. Return participant details.
        return new AttendanceScanResponse(
                true,
                "Attendance marked successfully!",
                attendance.getAttendanceId(),
                ticket.getTicketId(),
                participant.getName(),
                participant.getEmail(),
                team.getTeamName(),
                event.getEventName(),
                attendance.getCheckedInAt()
        );
    }
}

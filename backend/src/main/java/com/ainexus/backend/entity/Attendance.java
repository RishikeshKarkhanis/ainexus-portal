
package com.ainexus.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "attendance",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_attendance_ticket",
                        columnNames = "ticket_id"
                )
        }
)
@Getter
@Setter
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID attendanceId;

    @Column(name = "ticket_id", nullable = false, unique = true)
    private UUID ticketId;

    @Column(name = "team_member_id", nullable = false)
    private UUID teamMemberId;

    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @Column(name = "scanned_by", nullable = false)
    private UUID scannedBy;

    @Column(name = "checked_in_at", nullable = false)
    private LocalDateTime checkedInAt;

    @PrePersist
    public void onCreate() {
        if (checkedInAt == null) {
            checkedInAt = LocalDateTime.now();
        }
    }
}


package com.ainexus.backend.entity;

import jakarta.persistence.*;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "events", schema = "public")
@Getter
@Setter
@NoArgsConstructor
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "event_id")
    private UUID eventId;

    @Column(name = "event_name", nullable = false)
    private String eventName;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @Column(name = "registration_fee", nullable = false)
    private Integer registrationFee;

    @Column(name = "college_only", nullable = false)
    private Boolean collegeOnly;

    @Column(name = "registration_status", nullable = false)
    private String registrationStatus;

    @Column(name = "thumbnail_path")
    private String thumbnailPath;

    @Column(name = "min_team_size")
    private Integer minTeamSize;

    @Column(name = "max_team_size")
    private Integer maxTeamSize;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

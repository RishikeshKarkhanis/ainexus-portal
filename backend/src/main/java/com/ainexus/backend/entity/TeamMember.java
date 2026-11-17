package com.ainexus.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(
        name = "team_members",
        schema = "public",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_team_member",
                        columnNames = {"team_id", "user_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
public class TeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "team_member_id")
    private UUID teamMemberId;

    @Column(name = "team_id", nullable = false)
    private UUID teamId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;
}
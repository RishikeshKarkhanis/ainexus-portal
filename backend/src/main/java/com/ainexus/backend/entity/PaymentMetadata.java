package com.ainexus.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "payment_metadata", schema = "public")
@Getter
@Setter
@NoArgsConstructor
public class PaymentMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "metadata_id")
    private UUID metadataId;

    @Column(name = "payment_id", nullable = false, unique = true)
    private UUID paymentId;

    @Column(name = "leader_id", nullable = false)
    private UUID leaderId;

    @Column(name = "team_name", nullable = false, length = 120)
    private String teamName;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "member_ids", nullable = false, columnDefinition = "uuid[]")
    private UUID[] memberIds;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}

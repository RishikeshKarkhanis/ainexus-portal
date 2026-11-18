package com.ainexus.backend.repository;

import com.ainexus.backend.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TeamMemberRepository extends JpaRepository<TeamMember, UUID> {

    List<TeamMember> findAllByTeamId(UUID teamId);

    List<TeamMember> findAllByUserId(UUID userId);

    boolean existsByTeamIdAndUserId(UUID teamId, UUID userId);

    boolean existsByUserId(UUID userId);
}

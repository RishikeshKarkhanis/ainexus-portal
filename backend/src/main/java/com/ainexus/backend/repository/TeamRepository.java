package com.ainexus.backend.repository;

import com.ainexus.backend.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TeamRepository extends JpaRepository<Team, UUID> {

    List<Team> findAllByEventId(UUID eventId);

    List<Team> findAllByLeaderId(UUID leaderId);

    boolean existsByEventIdAndLeaderId(UUID eventId, UUID leaderId);
}
package com.ainexus.backend.repository;

import com.ainexus.backend.entity.Registration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RegistrationRepository extends JpaRepository<Registration, UUID> {

    List<Registration> findAllByEventId(UUID eventId);

    Optional<Registration> findByTeamId(UUID teamId);

    boolean existsByEventIdAndTeamId(UUID eventId, UUID teamId);
}

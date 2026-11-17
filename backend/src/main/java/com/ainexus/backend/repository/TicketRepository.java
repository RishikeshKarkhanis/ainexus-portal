package com.ainexus.backend.repository;

import com.ainexus.backend.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    List<Ticket> findAllByTeamMemberId(UUID teamMemberId);

    Optional<Ticket> findByQrToken(String qrToken);

    boolean existsByQrToken(String qrToken);
}

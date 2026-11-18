
package com.ainexus.backend.repository;

import com.ainexus.backend.entity.Attendance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AttendanceRepository
        extends JpaRepository<Attendance, UUID> {

    boolean existsByTicketId(UUID ticketId);

    long countByEventId(UUID eventId);

    List<Attendance> findAllByEventId(UUID eventId);
}

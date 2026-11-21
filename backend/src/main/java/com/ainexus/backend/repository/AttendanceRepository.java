package com.ainexus.backend.repository;

import com.ainexus.backend.entity.Attendance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface AttendanceRepository
        extends JpaRepository<Attendance, UUID> {

    boolean existsByTicketId(UUID ticketId);

    long countByEventId(UUID eventId);

    List<Attendance> findAllByEventId(UUID eventId);

    @Query(value = """
            SELECT
                u.name AS "name",
                u.enrollment_number AS "enrollmentNumber",
                u."userId" AS "userId",
                t.team_name AS "teamName",
                t.team_id AS "teamId",
                e.event_name AS "eventName",
                e.event_id AS "eventId",
                a.checked_in_at AS "timestamp"
            FROM public.attendance a
            INNER JOIN public.team_members tm
                ON tm.team_member_id = a.team_member_id
            INNER JOIN public.users u
                ON u."userId" = tm.user_id
            INNER JOIN public.teams t
                ON t.team_id = tm.team_id
                AND t.event_id = a.event_id
            INNER JOIN public.events e
                ON e.event_id = a.event_id
            ORDER BY a.checked_in_at DESC
            """, nativeQuery = true)
    List<AttendanceRecordProjection> findAllAttendanceRecords();
}

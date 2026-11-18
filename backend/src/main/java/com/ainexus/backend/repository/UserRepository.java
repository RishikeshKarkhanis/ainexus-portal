package com.ainexus.backend.repository;

import com.ainexus.backend.entity.User;
import com.ainexus.backend.dto.response.UserSearchResponse;
import com.ainexus.backend.dto.response.AdminUserResponse;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);

    // Fetch only users with admin privileges
    List<User> findAllByIsAdminTrue();

    long countByIsAdminTrue();

    long countByEmailVerifiedTrue();

    // Search all users and indicate event registration status
    @Query(value = """
        SELECT
            u."userId" AS "userId",
            u.name AS name,
            u.email AS email,
            CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM team_members tm
                    JOIN teams t ON t.team_id = tm.team_id
                    WHERE tm.user_id = u."userId"
                      AND t.event_id = :eventId
                )
                THEN TRUE
                ELSE FALSE
            END AS "alreadyRegistered"
        FROM users u
        WHERE u."userId" <> :currentUserId
          AND (
              LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%'))
              OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))
          )
        ORDER BY u.name
        LIMIT 10
        """, nativeQuery = true)
    List<UserSearchResponse> searchAvailableUsers(
            @Param("eventId") UUID eventId,
            @Param("currentUserId") UUID currentUserId,
            @Param("query") String query
    );

    // Fetch current administrators without exposing sensitive fields
    @Query("""
        SELECT new com.ainexus.backend.dto.response.AdminUserResponse(
            u.userId, u.name, u.email
        )
        FROM User u
        WHERE u.isAdmin = true
        ORDER BY u.name
    """)
    List<AdminUserResponse> findAdminUsers();

    // Search existing non-admin users by name or email
    @Query("""
        SELECT new com.ainexus.backend.dto.response.AdminUserResponse(
            u.userId, u.name, u.email
        )
        FROM User u
        WHERE u.isAdmin = false
          AND (
              LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%'))
              OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))
          )
        ORDER BY u.name
    """)
    List<AdminUserResponse> searchNonAdminUsers(
            @Param("query") String query,
            Pageable pageable
    );
}

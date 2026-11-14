package com.ainexus.backend.repository;

import com.ainexus.backend.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EventRepository extends JpaRepository<Event, UUID> {

    // Find events by registration status
    List<Event> findByRegistrationStatus(String registrationStatus);

    // Find events restricted to Acropolis students
    List<Event> findByCollegeOnly(Boolean collegeOnly);
}
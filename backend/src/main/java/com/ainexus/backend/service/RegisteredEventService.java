package com.ainexus.backend.service;

import com.ainexus.backend.dto.response.RegisteredEventResponse;
import com.ainexus.backend.entity.Registration;
import com.ainexus.backend.entity.TeamMember;
import com.ainexus.backend.entity.User;
import com.ainexus.backend.repository.UserRepository;
import com.ainexus.backend.repository.TeamMemberRepository;
import com.ainexus.backend.repository.RegistrationRepository;
import com.ainexus.backend.repository.EventRepository;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class RegisteredEventService {

    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final RegistrationRepository registrationRepository;
    private final EventRepository eventRepository;
    private final SupabaseStorageService supabaseStorageService;

    public RegisteredEventService(
            UserRepository userRepository,
            TeamMemberRepository teamMemberRepository,
            RegistrationRepository registrationRepository,
            EventRepository eventRepository,
            SupabaseStorageService supabaseStorageService
    ) {
        this.userRepository = userRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.registrationRepository = registrationRepository;
        this.eventRepository = eventRepository;
        this.supabaseStorageService = supabaseStorageService;
    }

    public List<RegisteredEventResponse> getRegisteredEvents(
            Authentication authentication
    ) {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required"
            );
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        List<TeamMember> memberships =
                teamMemberRepository.findAllByUserId(user.getUserId());

        List<RegisteredEventResponse> result = new ArrayList<>();
        Set<UUID> processedEvents = new HashSet<>();

        for (TeamMember member : memberships) {

            Optional<Registration> registration =
                    registrationRepository.findByTeamId(member.getTeamId());

            if (registration.isEmpty()) {
                continue;
            }

            Registration reg = registration.get();

            // Avoid duplicate events if the user has multiple teams
            if (!processedEvents.add(reg.getEventId())) {
                continue;
            }

            eventRepository.findById(reg.getEventId()).ifPresent(event -> {

                String thumbnailUrl = event.getThumbnailPath() != null
                        && !event.getThumbnailPath().isBlank()
                        ? supabaseStorageService.getPublicUrl(
                        event.getThumbnailPath()
                )
                        : null;

                result.add(new RegisteredEventResponse(
                        event.getEventId(),
                        event.getEventName(),
                        event.getDescription(),
                        event.getEventDate(),
                        event.getRegistrationFee(),
                        thumbnailUrl,
                        reg.getRegistrationDate(),
                        reg.getTeamName()
                ));
            });
        }

        return result;
    }
}

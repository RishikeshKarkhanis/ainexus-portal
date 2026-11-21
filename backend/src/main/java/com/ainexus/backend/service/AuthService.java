package com.ainexus.backend.service;

import com.ainexus.backend.dto.request.LoginRequest;
import com.ainexus.backend.dto.request.RegisterRequest;
import com.ainexus.backend.dto.response.LoginResponse;
import com.ainexus.backend.dto.response.RegisterResponse;
import com.ainexus.backend.entity.User;
import com.ainexus.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public RegisterResponse register(RegisterRequest request) {

        String email = request.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        // Acropolis student email validation
        if (request.isAcropolisStudent()
                && !email.endsWith("@acropolis.in")) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Acropolis students must register using their @acropolis.in email address."
            );
        }

        // Normalize the optional enrollment number
        String enrollmentNumber = request.getEnrollmentNumber() == null
                ? null
                : request.getEnrollmentNumber().trim();

        if (enrollmentNumber != null && enrollmentNumber.isEmpty()) {
            enrollmentNumber = null;
        }

        // Acropolis students must provide an enrollment number
        if (request.isAcropolisStudent()
                && enrollmentNumber == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Acropolis students must provide their enrollment number."
            );
        }

        // External users should not submit an institutional enrollment number
        if (!request.isAcropolisStudent()) {
            enrollmentNumber = null;
        }

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email already registered"
            );
        }

        // Prevent duplicate enrollment numbers
        if (enrollmentNumber != null
                && userRepository.existsByEnrollmentNumber(enrollmentNumber)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This enrollment number is already registered."
            );
        }

        User user = new User();

        user.setName(request.getName().trim());
        user.setEmail(email);
        user.setEnrollmentNumber(enrollmentNumber);
        user.setPasswordHash(
                passwordEncoder.encode(request.getPassword())
        );

        User savedUser = userRepository.save(user);

        return new RegisterResponse(
                savedUser.getUserId(),
                savedUser.getName(),
                savedUser.getEmail(),
                "Registration successful"
        );
    }

    public LoginResponse login(LoginRequest request) {

        String email = request.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        // Find user by email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid email or password"
                ));

        // Verify password
        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPasswordHash()
        )) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password"
            );
        }

        // Generate JWT
        String token = jwtService.generateToken(user.getEmail());

        // Return login response
        return new LoginResponse(
                token,
                "Bearer",
                900000,
                user.getUserId(),
                user.getName(),
                user.getEmail(),
                user.isAdmin()
        );
    }
}
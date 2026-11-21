package com.ainexus.backend.controller;

import com.ainexus.backend.dto.request.AttendanceScanRequest;
import com.ainexus.backend.dto.response.AttendanceRecordResponse;
import com.ainexus.backend.dto.response.AttendanceScanResponse;
import com.ainexus.backend.service.AttendanceService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    // ==========================================
    // FETCH ATTENDANCE RECORDS
    // ==========================================

    @GetMapping
    public ResponseEntity<?> getAttendanceRecords(
            Authentication authentication
    ) {

        try {

            if (authentication == null ||
                    !authentication.isAuthenticated()) {

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of(
                                "success", false,
                                "message", "Authentication required"
                        ));
            }

            List<AttendanceRecordResponse> records =
                    attendanceService.getAttendanceRecords(
                            authentication.getName()
                    );

            return ResponseEntity.ok(records);

        } catch (IllegalArgumentException exception) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of(
                            "success", false,
                            "message", exception.getMessage()
                    )
            );

        } catch (SecurityException exception) {

            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                    Map.of(
                            "success", false,
                            "message", exception.getMessage()
                    )
            );
        }
    }

    // ==========================================
    // SCAN QR AND MARK ATTENDANCE
    // ==========================================

    @PostMapping("/scan")
    public ResponseEntity<?> scanAndMarkAttendance(
            @Valid @RequestBody AttendanceScanRequest request,
            Authentication authentication
    ) {

        try {

            if (authentication == null ||
                    !authentication.isAuthenticated()) {

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of(
                                "success", false,
                                "message", "Authentication required"
                        ));
            }

            AttendanceScanResponse response =
                    attendanceService.scanAndMarkAttendance(
                            request,
                            authentication.getName()
                    );

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException exception) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", exception.getMessage()
                    )
            );

        } catch (SecurityException exception) {

            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                    Map.of(
                            "success", false,
                            "message", exception.getMessage()
                    )
            );

        } catch (IllegalStateException exception) {

            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                    Map.of(
                            "success", false,
                            "message", exception.getMessage()
                    )
            );
        }
    }
}

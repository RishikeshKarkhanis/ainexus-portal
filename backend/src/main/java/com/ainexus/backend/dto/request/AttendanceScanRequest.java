
package com.ainexus.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AttendanceScanRequest(

        @NotBlank(message = "QR token is required")
        String qrToken

) {}

package com.ainexus.backend.dto.response;

public record AdminDashboardResponse(
        long totalUsers,
        long totalAdmins,
        long verifiedUsers,
        long unverifiedUsers
) {}

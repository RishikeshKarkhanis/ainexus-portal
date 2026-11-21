package com.ainexus.backend.service;

import com.ainexus.backend.dto.response.AdminDashboardResponse;
import com.ainexus.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final UserRepository userRepository;

    public AdminDashboardResponse getDashboardStats() {

        long totalUsers = userRepository.count();

        long totalAdmins = userRepository.countByIsAdminTrue();

        return new AdminDashboardResponse(
                totalUsers,
                totalAdmins
        );
    }
}
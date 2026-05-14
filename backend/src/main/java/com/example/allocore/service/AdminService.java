package com.example.allocore.service;

import com.example.allocore.entity.ResourcesTable;
import com.example.allocore.repository.ResourcesTableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
@Service
public class AdminService {

    @Autowired
    private ResourcesTableRepository resourceRepository;

    public Map<String, Long> getDashboardStats() {
        Map<String, Long> stats = new HashMap<>();

        stats.put("total", resourceRepository.count());
        stats.put("available", resourceRepository.countByStatus(ResourcesTable.Status.AVAILABLE));
        stats.put("requested", resourceRepository.countByStatus(ResourcesTable.Status.REQUESTED));
        stats.put("in_use", resourceRepository.countByStatus(ResourcesTable.Status.IN_USE));

        return stats;
    }
}
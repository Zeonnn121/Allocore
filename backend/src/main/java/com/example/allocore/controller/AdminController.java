package com.example.allocore.controller;

import com.example.allocore.entity.ResourcesTable;
import com.example.allocore.repository.ResourcesTableRepository;
import com.example.allocore.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
public class AdminController {
    ResourcesTableRepository resourcesTableRepository;
    @Autowired
    private AdminService adminService;
    @PreAuthorize("hasRole('ORG_ADMIN')")
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }



}

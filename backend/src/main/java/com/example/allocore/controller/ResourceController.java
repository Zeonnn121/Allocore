package com.example.allocore.controller;

import com.example.allocore.entity.ResourcesTable;
import com.example.allocore.repository.AllocationRepository;
import com.example.allocore.repository.ResourcesTableRepository;
import com.example.allocore.service.ResourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/resources")
public class ResourceController {
AllocationRepository allocationRepository;
    private final ResourcesTableRepository resourcesTableRepository;

    public ResourceController(ResourcesTableRepository resourcesTableRepository) {
        this.resourcesTableRepository = resourcesTableRepository;
    }

    // Get all resources
    @GetMapping("/all")
    public Object getResources() {
        return resourcesTableRepository.findAll();
    }

    // Get resource by id
    @GetMapping("/{id}")
    public Object getResource(@PathVariable Integer id) {
        return resourcesTableRepository.findById(id).orElse(null);
    }

    // Get available resources
    @GetMapping("/available")
    public List<ResourcesTable> getAvailableResources() {
        return resourcesTableRepository.findAll()
                .stream()
                .filter(r -> "AVAILABLE".equals(r.getStatus()))
                .collect(Collectors.toList());
    }

    // Create resource
    @PreAuthorize("hasRole('ORG_ADMIN')")
    @PostMapping("/create")
    public String createResource(@RequestBody ResourcesTable resource) {
        resource.setStatus(ResourcesTable.Status.AVAILABLE);
        resourcesTableRepository.save(resource);
        return "Resource created";
    }

    // Update resource status
    @PutMapping("/update/{id}")
    public String updateResource(@PathVariable Integer id, @RequestBody ResourcesTable updatedResource) {

        var resource = resourcesTableRepository.findById(id).orElse(null);

        if(resource == null){
            return "Resource not found";
        }

        resource.setOrganization(updatedResource.getOrganization());

        resourcesTableRepository.save(resource);

        return "Resource updated";
    }

    // Delete resource
    @DeleteMapping("/delete/{id}")
    public String deleteResource(@PathVariable Integer id) {
        resourcesTableRepository.deleteById(id);
        return "Resource deleted!";
    }
    @PreAuthorize("hasAnyRole('ORG_ADMIN','STAFF')")
    @PutMapping("/status/{id}")
    public String updateStatus(@PathVariable Integer id, @RequestParam String status) {

        ResourcesTable resource = resourcesTableRepository.findById(id).orElse(null);

        if (resource == null) {
            return "Resource not found";
        }
        try {
            ResourcesTable.Status enumStatus = ResourcesTable.Status.valueOf(status.toUpperCase());
            resource.setStatus(enumStatus);
        } catch (IllegalArgumentException e) {
            return "Invalid status";
        }
        resourcesTableRepository.save(resource);

        return "Status updated";
    }
    @PreAuthorize("hasRole('USER')")
    @PutMapping("/request/{id}")
    public String requestResource(@PathVariable Integer id) {

        ResourcesTable resource = resourcesTableRepository.findById(id).orElse(null);

        if (resource == null) return "Not found";
        resource.setStatus(ResourcesTable.Status.REQUESTED);
        resourcesTableRepository.save(resource);

        return "Request sent";
    }
    @PreAuthorize("hasRole('ORG_ADMIN')")
    @PutMapping("/approve/{id}")
    public String approve(@PathVariable Integer id) {

        ResourcesTable r = resourcesTableRepository.findById(id).orElse(null);

        if (r == null) return "Not found";

     r.setStatus(ResourcesTable.Status.IN_USE);
        resourcesTableRepository.save(r);

        return "Approved";
    }
    @PreAuthorize("hasRole('STAFF')")
    @PutMapping("/complete/{id}")
    public String complete(@PathVariable Integer id) {

        ResourcesTable r = resourcesTableRepository.findById(id).orElse(null);

        if (r == null) return "Not found";

        r.setStatus(ResourcesTable.Status.AVAILABLE);
        resourcesTableRepository.save(r);

        return "Completed";
    }
    @PreAuthorize("hasRole('ORG_ADMIN')")
    @GetMapping("/pending")
    public List<ResourcesTable> getPendingRequests() {
        return resourcesTableRepository.findByStatus(ResourcesTable.Status.REQUESTED);
    }

        @Autowired
        private ResourceService service;

    @PreAuthorize("hasAnyRole('STAFF','ORG_ADMIN')")
        @GetMapping("/assigned")
        public ResponseEntity<List<ResourcesTable>> getAssignedResources(@RequestParam String email) {

            List<ResourcesTable> assignedResources = service.getAssignedResources(email);

            return ResponseEntity.ok(assignedResources);
        }
    }

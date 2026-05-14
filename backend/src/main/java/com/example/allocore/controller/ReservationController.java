package com.example.allocore.controller;

import com.example.allocore.entity.Allocations;
import com.example.allocore.entity.ResourcesTable;
import com.example.allocore.repository.AllocationRepository;
import com.example.allocore.repository.ResourcesTableRepository;
import com.example.allocore.repository.UsersRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/reservation")
public class ReservationController {

    private final AllocationRepository allocationRepository;
    private final UsersRepository usersRepository;
    private final ResourcesTableRepository resourcesTableRepository;

    public ReservationController(
            AllocationRepository allocationRepository,
            UsersRepository usersRepository,
            ResourcesTableRepository resourcesTableRepository
    ) {
        this.allocationRepository = allocationRepository;
        this.usersRepository = usersRepository;
        this.resourcesTableRepository = resourcesTableRepository;
    }

    // Get all reservations
    @GetMapping("/all")
    public Object getAllocations() {
        return allocationRepository.findAll();
    }

    // Get allocations for a user
    @GetMapping("/user/{id}")
    public List<Allocations> getUserAllocations(@PathVariable Integer id) {
        return allocationRepository.findAll()
                .stream()
                .filter(a -> a.getUser() != null && a.getUser().getId().equals(id))
                .collect(Collectors.toList());
    }

    // Reserve resource
    @PostMapping("/reserve")
    public String reserveResource(@RequestBody Allocations allocationRequest) {

        Integer userId = allocationRequest.getUser().getId();
        Integer resourceId = allocationRequest.getResource().getId();

        var user = usersRepository.findById(userId).orElse(null);
        if (user == null) {
            return "User not found";
        }

        var resource = resourcesTableRepository.findById(resourceId).orElse(null);
        if (resource == null) {
            return "Resource not found";
        }

        if (!"AVAILABLE".equals(resource.getStatus())) {
            return "Resource already reserved";
        }

        Allocations allocation = new Allocations();
        allocation.setUser(user);
        allocation.setResource(resource);

        allocationRepository.save(allocation);

        resource.setStatus(ResourcesTable.Status.RESERVED);
        resourcesTableRepository.save(resource);

        return "Resource reserved successfully";
    }


    // Unreserve resource
    @PostMapping("/unreserve")
    public String unreserveResource(@RequestBody Allocations allocationRequest) {

        Integer userId = allocationRequest.getUser().getId();
        Integer resourceId = allocationRequest.getResource().getId();

        var user = usersRepository.findById(userId).orElse(null);
        if (user == null) {
            return "User not found";
        }

        var resource = resourcesTableRepository.findById(resourceId).orElse(null);
        if (resource == null) {
            return "Resource not found";
        }

        if (!"RESERVED".equals(resource.getStatus())) {
            return "Resource is not reserved";
        }

        var allocations = allocationRepository.findAll();

        for (var allocation : allocations) {

            if (allocation.getUser() == null || allocation.getResource() == null) {
                continue;
            }

            if (allocation.getUser().getId().equals(userId) &&
                    allocation.getResource().getId().equals(resourceId)) {

                allocationRepository.delete(allocation);

                resource.setStatus(ResourcesTable.Status.AVAILABLE);
                resourcesTableRepository.save(resource);

                return "Resource unreserved successfully";
            }
        }

        return "Allocation not found";
    }
    @PreAuthorize("hasRole('STAFF')")
    @GetMapping("/active")
    public List<Allocations> getActiveTasks(@RequestParam String email) {

        return allocationRepository.findAll()
                .stream()
                .filter(a ->
                        a.getUser() != null &&
                                a.getUser().getEmail().equals(email) &&
                                a.getResource() != null &&
                                a.getResource().getStatus() == ResourcesTable.Status.IN_USE
                )
                .toList();
    }
}
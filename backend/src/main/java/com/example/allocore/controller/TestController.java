package com.example.allocore.controller;

import com.example.allocore.entity.Allocations;
import com.example.allocore.entity.ResourcesTable;
import com.example.allocore.entity.Users;
import com.example.allocore.repository.AllocationRepository;
import com.example.allocore.repository.ResourcesTableRepository;
import com.example.allocore.repository.UsersRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/test")
public class TestController {

    private final UsersRepository usersRepository;
    private final ResourcesTableRepository resourcesRepository;

    private final AllocationRepository allocationRepository;

    public TestController(
            UsersRepository usersRepository,
            ResourcesTableRepository resourcesRepository,
            AllocationRepository allocationRepository) {

        this.usersRepository = usersRepository;
        this.resourcesRepository = resourcesRepository;

        this.allocationRepository = allocationRepository;
    }

    // *********** CHECK ***********
    @GetMapping("/ping")
    public String ping() {
        return "Server working";
    }

    // ********** USERS **********

    @GetMapping("/users/all")
    public Object getUsers() {
        return usersRepository.findAll();
    }

    @GetMapping("/users/{id}")
    public Object getUser(@PathVariable Integer id) {
        return usersRepository.findById(id).orElse(null);
    }

    @PostMapping("/users/create")
    public String createUser(@RequestBody Users user) {
        usersRepository.save(user);
        return "User created";
    }

    @DeleteMapping("/users/delete/{id}")
    public String deleteUsers(@PathVariable Integer id) {
        usersRepository.deleteById(id);
        return "User deleted!";
    }

    // ************* RESOURCES **************

    @GetMapping("/resources/all")
    public Object getResources() {
        return resourcesRepository.findAll();
    }

    @GetMapping("/resources/{id}")
    public Object getResource(@PathVariable Integer id) {
        return resourcesRepository.findById(id).orElse(null);
    }

    @GetMapping("/resources/available")
    public List<ResourcesTable> getAvailableResources() {
        return resourcesRepository.findAll()
                .stream()
                .filter(r -> "AVAILABLE".equals(r.getStatus()))
                .collect(Collectors.toList());
    }

    @PostMapping("/resources/create")
    public String createResource(@RequestBody ResourcesTable resource) {
        resource.setStatus(ResourcesTable.Status.AVAILABLE);
        resourcesRepository.save(resource);
        return "Resource created";
    }

    @PutMapping("/resources/update/{id}")
    public String updateResource(@PathVariable Integer id) {

        var resource = resourcesRepository.findById(id).orElse(null);

        if (resource == null) {
            return "Resource not found";
        }

        resource.setStatus(ResourcesTable.Status.RESERVED);
        resourcesRepository.save(resource);

        return "Resource updated!";
    }

    @DeleteMapping("/resources/delete/{id}")
    public String deleteResource(@PathVariable Integer id) {
        resourcesRepository.deleteById(id);
        return "Resource deleted!";
    }

    // *********** RESOURCE TYPES **********


    // ********** ALLOCATIONS ************

    @GetMapping("/allocations/all")
    public Object getAllocations() {
        return allocationRepository.findAll();
    }

    @GetMapping("/users/{id}/allocations")
    public List<Allocations> getUserAllocations(@PathVariable Integer id) {
        return allocationRepository.findAll()
                .stream()
                .filter(a -> a.getUser() != null && a.getUser().getId().equals(id))
                .collect(Collectors.toList());
    }

    // ******* RESERVE RESOURCE ********

    @PostMapping("/reserve")
    public String reserveResource(@RequestParam Integer userId,
                                  @RequestParam Integer resourceId) {

        var user = usersRepository.findById(userId).orElse(null);
        if (user == null) {
            return "User not found";
        }

        var resource = resourcesRepository.findById(resourceId).orElse(null);
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
        resourcesRepository.save(resource);

        return "Resource reserved successfully";
    }

    // ********* UNRESERVE RESOURCE ********

    @PostMapping("/unreserve")
    public String unreserveResource(@RequestParam Integer userId,
                                    @RequestParam Integer resourceId) {

        var user = usersRepository.findById(userId).orElse(null);
        if (user == null) {
            return "User not found";
        }

        var resource = resourcesRepository.findById(resourceId).orElse(null);
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
                resourcesRepository.save(resource);

                return "Resource unreserved successfully";
            }
        }

        return "Allocation not found";
    }
}
package com.example.allocore.controller;

import com.example.allocore.entity.Organization;
import com.example.allocore.entity.Users;
import com.example.allocore.repository.OrganizationRepository;
import com.example.allocore.repository.UsersRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/organizations")
public class OrganizationController {
    @Autowired
    private UsersRepository usersRepository;

    private final OrganizationRepository organizationRepository;

    public OrganizationController(OrganizationRepository organizationRepository) {
        this.organizationRepository = organizationRepository;
    }

    // Get all organizations
    @GetMapping("/all")
    public Object getOrganizations() {
        return organizationRepository.findAll();
    }

    // Get organization by id
    @GetMapping("/{id}")
    public Object getOrganization(@PathVariable Integer id) {
        return organizationRepository.findById(id).orElse(null);
    }

    // Create organization
    @PostMapping("/create")
    public String createOrganization(@RequestBody Organization organization) {
        organizationRepository.save(organization);
        return "Organization created";
    }

    // Delete organization
    @DeleteMapping("/delete/{id}")
    public String deleteOrganization(@PathVariable Integer id) {
        organizationRepository.deleteById(id);
        return "Organization deleted";
    }
    @GetMapping("/invite-code")
    public String getInviteCode() {

        String email = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        Users user = usersRepository.findByEmail(email);

        if (user.getRole() != Users.Role.ORG_ADMIN) {
            return "Not allowed";
        }

        if (user.getOrganization() == null) {
            return "No organization";
        }

        return user.getOrganization().getInviteCode();
    }
}
package com.example.allocore.controller;

import com.example.allocore.dto.RegisterRequest;
import com.example.allocore.entity.Organization;
import com.example.allocore.entity.Users;
import com.example.allocore.repository.OrganizationRepository;
import com.example.allocore.repository.UsersRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {
    @Autowired
    private OrganizationRepository organizationRepository;
    private final UsersRepository usersRepository;

    public UserController(UsersRepository usersRepository) {
        this.usersRepository = usersRepository;
    }

    // Get all users
    @GetMapping("/all")
    public Object getUsers() {
        return usersRepository.findAll();
    }

    // Get user by id
    @GetMapping("/{id}")
    public Object getUser(@PathVariable Integer id) {
        return usersRepository.findById(Integer.valueOf(id)).orElse(null);
    }

    // Create user

    @PostMapping("/register")
    public String register(@RequestBody RegisterRequest request) {

        Users user = new Users();
        user.setName(request.name);
        user.setEmail(request.email);
        user.setPassword(request.password);
        user.setRole(Users.Role.valueOf(request.role));

        if (request.inviteCode != null && !request.inviteCode.isEmpty()) {

            Organization org = organizationRepository.findByInviteCode(request.inviteCode);

            if (org == null) {
                return "Invalid invite code";
            }

            user.setOrganization(org);
        }

        usersRepository.save(user);

        return "User registered";
    }
    // Delete user
    @DeleteMapping("/delete/{id}")
    public String deleteUsers(@PathVariable Integer id) {
        usersRepository.deleteById(id);
        return "User deleted!";
    }
    @PreAuthorize("hasRole('ORG_ADMIN')")
    @PutMapping("/remove/{id}")
    public String removeUserFromOrg(@PathVariable Integer id) {
        String currentEmail = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();


        Users user = usersRepository.findById(id).orElse(null);
        if (user.getEmail().equals(currentEmail)) {
            return "You cannot remove yourself";
        }
        if (user == null) {
            return "User not found";
        }

        user.setOrganization(null);
        usersRepository.save(user);

        return "User removed from organization";
    }
    @GetMapping("/org")
    public List<Users> getUsersInOrg() {

        String email = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        Users currentUser = usersRepository.findByEmail(email);

        if (currentUser.getRole() != Users.Role.ORG_ADMIN) {
            return List.of();
        }

        return usersRepository.findByOrganization(currentUser.getOrganization());
    }
    @PreAuthorize("hasRole('ORG_ADMIN')")
    @PutMapping("/update-role/{id}")
    public String updateUserRole(@PathVariable Integer id, @RequestParam String role) {

        Users user = usersRepository.findById(id).orElse(null);

        if (user == null) {
            return "User not found";
        }

        user.setRole(Users.Role.valueOf(role));
        usersRepository.save(user);
        if (user.getRole() == Users.Role.SUPER_ADMIN) {
            return "Cannot change SUPER_ADMIN";
        }
        return "Role updated";
    }

}
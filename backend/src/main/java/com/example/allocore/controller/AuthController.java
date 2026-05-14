package com.example.allocore.controller;

import com.example.allocore.dto.LoginRequest;
import com.example.allocore.dto.RegisterRequest;
import com.example.allocore.entity.Organization;
import com.example.allocore.entity.Users;
import com.example.allocore.repository.OrganizationRepository;
import com.example.allocore.repository.UsersRepository;
import com.example.allocore.security.JwtService;
import com.example.allocore.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private OrganizationRepository organizationRepository;


    @Autowired
    private JwtService jwtService;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;
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
    @PostMapping("/login")
    public Map<String, String> login(@RequestBody LoginRequest request) {

        Users user = usersRepository.findByEmail(request.getEmail());

        if (user == null) {
            throw new RuntimeException("User not found");
        }

        if (!request.getPassword().equals(user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtService.generateToken(
                user.getEmail(),
                user.getRole().name()
        );

        return Map.of("token", token);
    }


}
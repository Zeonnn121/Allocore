package com.example.allocore.repository;

import com.example.allocore.entity.Organization;
import com.example.allocore.entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UsersRepository extends JpaRepository<Users, Integer> {
    List<Users> findByOrganization(Organization organization);
    Users findByEmail(String email);
}
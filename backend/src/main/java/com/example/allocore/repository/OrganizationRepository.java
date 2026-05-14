package com.example.allocore.repository;

import com.example.allocore.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganizationRepository extends JpaRepository<Organization, Integer> {
    Organization findByInviteCode(String inviteCode);


}
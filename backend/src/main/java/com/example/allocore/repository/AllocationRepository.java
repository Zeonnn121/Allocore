package com.example.allocore.repository;

import com.example.allocore.entity.Allocations;

import com.example.allocore.entity.ResourcesTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AllocationRepository extends JpaRepository<Allocations, Long> {

    @Query("""
SELECT a.resource 
FROM Allocations a 
WHERE a.user.email = :email 
AND a.resource.status = com.example.allocore.entity.ResourcesTable.Status.IN_USE
""")
    List<ResourcesTable> findAssignedResourcesByUserEmail(@Param("email") String email);
}

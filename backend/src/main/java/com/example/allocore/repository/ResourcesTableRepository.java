package com.example.allocore.repository;


import com.example.allocore.entity.ResourcesTable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResourcesTableRepository extends JpaRepository<ResourcesTable,Integer>{
    List<ResourcesTable> findByStatus(ResourcesTable.Status status);
    long countByStatus(ResourcesTable.Status status);
}

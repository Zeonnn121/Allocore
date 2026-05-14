package com.example.allocore.service;

import com.example.allocore.entity.ResourcesTable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ResourceService {

    public List<ResourcesTable> getAssignedResources(String email) {
        return List.of(); // temporary
    }
}
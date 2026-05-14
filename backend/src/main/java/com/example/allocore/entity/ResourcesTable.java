package com.example.allocore.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "resourcestable")
public class ResourcesTable {

    public enum Status {
        AVAILABLE,
        REQUESTED,
        IN_USE,
        RESERVED
    }
    @Id
    @Column(name="r_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(name = "name")
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status;

    @Column(name = "type")
    private String type;
    @ManyToOne
    @JoinColumn(name = "o_id")
    private Organization organization;

    public Organization getOrganization() {
        return organization;
    }

    public void setOrganization(Organization organization) {
        this.organization = organization;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }
}
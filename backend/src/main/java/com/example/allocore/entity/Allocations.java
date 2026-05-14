package com.example.allocore.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "allocations")
public class Allocations {

    @Id
    @Column(name="a_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "u_id")
    private Users user;

    public ResourcesTable getResource() {
        return resource;
    }

    public void setResource(ResourcesTable resource) {
        this.resource = resource;
    }

    public Users getUser() {
        return user;
    }

    public void setUser(Users user) {
        this.user = user;
    }

    @ManyToOne
    @JoinColumn(name = "r_id")
    private ResourcesTable resource;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

}
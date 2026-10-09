package com.campusbazaar.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "universities")
public class University extends BaseEntity {

    @Column(nullable = false, unique = true, length = 200)
    private String name;

    /** Email domain such as "example.edu.in" - optionally used to validate student emails. */
    @Column(unique = true, length = 120)
    private String domain;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(nullable = false, length = 100)
    private String state;

    @Column(nullable = false, length = 100)
    private String country = "India";

    @Column(nullable = false)
    private boolean active = true;

    protected University() {}

    public University(String name, String domain, String city, String state, String country) {
        this.name = name;
        this.domain = domain;
        this.city = city;
        this.state = state;
        this.country = country;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}

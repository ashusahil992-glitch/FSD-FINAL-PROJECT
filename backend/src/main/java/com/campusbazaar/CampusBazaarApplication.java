package com.campusbazaar;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

// UserDetailsServiceAutoConfiguration is excluded so Spring does not create a random default user.
// Real user loading is added in Phase 2.
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class CampusBazaarApplication {
    public static void main(String[] args) {
        SpringApplication.run(CampusBazaarApplication.class, args);
    }
}

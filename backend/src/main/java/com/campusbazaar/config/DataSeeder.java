package com.campusbazaar.config;

import com.campusbazaar.entity.Category;
import com.campusbazaar.entity.Role;
import com.campusbazaar.entity.University;
import com.campusbazaar.entity.User;
import com.campusbazaar.entity.UserStatus;
import com.campusbazaar.repository.CategoryRepository;
import com.campusbazaar.repository.UniversityRepository;
import com.campusbazaar.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Inserts demo data on first start. Safe to run repeatedly: each block only runs if its table is empty. */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UniversityRepository universityRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.enabled}") private boolean enabled;
    @Value("${app.admin.email}") private String adminEmail;
    @Value("${app.admin.password}") private String adminPassword;

    public DataSeeder(UniversityRepository universityRepository, CategoryRepository categoryRepository,
                      UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.universityRepository = universityRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!enabled) return;
        seedUniversities();
        seedCategories();
        seedAdmin();
    }

    private void seedUniversities() {
        if (universityRepository.count() > 0) return;
        // Fictional demo universities.
        universityRepository.saveAll(List.of(
                new University("Demo Institute of Technology", "dit.demo.edu.in", "Chandigarh", "Chandigarh", "India"),
                new University("Sample University of Sciences", "sus.demo.edu.in", "Pune", "Maharashtra", "India")));
        log.info("Seeded demo universities");
    }

    private void seedCategories() {
        if (categoryRepository.count() > 0) return;
        Map<String, List<String>> tree = new LinkedHashMap<>();
        tree.put("Academic", List.of("Books", "Textbooks", "Notes", "Lab Manuals", "Calculators", "Stationery", "Project Materials"));
        tree.put("Hostel", List.of("Mattress", "Study Table", "Chair", "Bedsheet", "Pillow", "Bucket", "Storage", "Hangers", "Lamps", "Extension Boards"));
        tree.put("Electronics", List.of("Laptop", "Keyboard", "Mouse", "Headphones", "Speakers", "Monitor", "Chargers", "Power Banks", "Cables"));
        tree.put("Fashion", List.of("Clothes", "Shoes", "Bags", "Watches", "Accessories"));
        tree.put("Sports & Fitness", List.of("Gym Equipment", "Sports Equipment", "Bicycles", "Sports Accessories"));
        tree.put("Appliances", List.of("Kettle", "Induction Cooker", "Fan", "Other Permitted Appliances"));
        tree.put("Gaming", List.of("Gaming Accessories", "Controllers", "Games", "Gaming Equipment"));
        Map<String, String> icons = Map.of("Academic", "📚", "Hostel", "🛏️", "Electronics", "💻", "Fashion", "👕",
                "Sports & Fitness", "🚲", "Appliances", "🔌", "Gaming", "🎮");

        tree.forEach((name, subs) -> {
            Category parent = categoryRepository.save(new Category(name, slug(name), icons.get(name), null));
            for (String sub : subs) {
                categoryRepository.save(new Category(sub, slug(name + "-" + sub), null, parent));
            }
        });
        log.info("Seeded categories");
    }

    private void seedAdmin() {
        if (userRepository.existsByEmailIgnoreCase(adminEmail)) return;
        User admin = new User("Platform Admin", adminEmail.toLowerCase(Locale.ROOT),
                passwordEncoder.encode(adminPassword), Role.ADMIN);
        admin.setEmailVerified(true);
        admin.setStudentVerified(true);
        admin.setStatus(UserStatus.VERIFIED);
        userRepository.save(admin);
        log.info("Seeded demo admin account: {}", adminEmail);
    }

    private static String slug(String s) {
        return s.toLowerCase(Locale.ROOT).replace("&", "and").replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    }
}

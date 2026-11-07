package com.campusbazaar.config;

import com.campusbazaar.entity.Category;
import com.campusbazaar.entity.Listing;
import com.campusbazaar.entity.ListingCondition;
import com.campusbazaar.entity.ListingType;
import com.campusbazaar.entity.Role;
import com.campusbazaar.entity.University;
import com.campusbazaar.entity.User;
import com.campusbazaar.entity.UserStatus;
import com.campusbazaar.repository.CategoryRepository;
import com.campusbazaar.repository.ListingRepository;
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
import java.math.BigDecimal;
import java.util.UUID;

/** Inserts demo data on first start. Safe to run repeatedly: each block only runs if its table is empty. */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UniversityRepository universityRepository;
    private final CategoryRepository categoryRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.enabled}") private boolean enabled;
    @Value("${app.admin.email}") private String adminEmail;
    @Value("${app.admin.password}") private String adminPassword;

    public DataSeeder(UniversityRepository universityRepository, CategoryRepository categoryRepository,
                      ListingRepository listingRepository,
                      UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.universityRepository = universityRepository;
        this.categoryRepository = categoryRepository;
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!enabled) return;
        seedUniversities();
        seedCategories();
        seedServiceCategories();
        seedListings();
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

    private void seedServiceCategories() {
        Category services = categoryRepository.findBySlug("services")
                .orElseGet(() -> categoryRepository.save(new Category("Services", "services", "🛠️", null)));
        Map<String, String> serviceCategories = Map.of(
                "Tutoring", "services-tutoring",
                "Design & Tech", "services-design-and-tech",
                "Repairs", "services-repairs",
                "Other Services", "services-other");
        serviceCategories.forEach((name, categorySlug) -> categoryRepository.findBySlug(categorySlug)
                .orElseGet(() -> categoryRepository.save(new Category(name, categorySlug, null, services))));
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

    private void seedListings() {
        if (listingRepository.count() > 0) return;
        List<University> universities = universityRepository.findByActiveTrueOrderByNameAsc();
        if (universities.isEmpty()) {
            throw new IllegalStateException("Cannot seed demo listings without an active university.");
        }

        List<DemoSeller> sellers = List.of(
                new DemoSeller("Aarav Mehta", "demo.seller1@campusbazaar.demo"),
                new DemoSeller("Isha Nair", "demo.seller2@campusbazaar.demo"),
                new DemoSeller("Kabir Shah", "demo.seller3@campusbazaar.demo"));
        List<User> savedSellers = sellers.stream()
                .map(seller -> getOrCreateDemoSeller(seller, universities.get(sellers.indexOf(seller) % universities.size())))
                .toList();

        List<Listing> listings = new java.util.ArrayList<>();
        listings.add(demoListing("Engineering Mathematics - 3rd Edition", "Well-kept semester textbook with clean pages and no markings.",
                "450", ListingCondition.GOOD, ListingType.SALE, "academic", savedSellers.get(0),
                "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=80", true, true, false));
        listings.add(demoListing("Noise-cancelling headphones", "Great sound and battery life. Includes the original charging cable.",
                "1800", ListingCondition.LIKE_NEW, ListingType.SALE, "electronics", savedSellers.get(1),
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80", true, true, false));
        listings.add(demoListing("Study table with drawer", "Compact wooden desk, ideal for hostel rooms. Pickup near campus.",
                "2200", ListingCondition.GOOD, ListingType.SALE, "hostel", savedSellers.get(2),
                "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=900&q=80", true, false, true));
        listings.add(demoListing("Scientific calculator", "All functions work perfectly; fresh battery installed.",
                "600", ListingCondition.GOOD, ListingType.SALE, "academic", savedSellers.get(0),
                "https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=900&q=80", false, true, false));
        listings.add(demoListing("Single-bed comforter set", "Comforter, bedsheet and pillow covers. Clean and ready to use.",
                "900", ListingCondition.LIKE_NEW, ListingType.SALE, "hostel", savedSellers.get(1),
                "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=900&q=80", false, true, true));
        listings.add(demoListing("Acoustic guitar", "A beginner-friendly guitar, available to rent for the semester.",
                "0", ListingCondition.GOOD, ListingType.RENT, "gaming", savedSellers.get(2),
                "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=900&q=80", true, false, false));
        listings.add(demoListing("Everyday campus backpack", "Roomy, lightweight backpack with a padded laptop sleeve.",
                "750", ListingCondition.GOOD, ListingType.SALE, "fashion", savedSellers.get(0),
                "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80", false, true, false));
        listings.add(demoListing("Desk lamp", "LED lamp with adjustable brightness and a flexible neck.",
                "350", ListingCondition.GOOD, ListingType.SALE, "hostel", savedSellers.get(1),
                "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80", false, false, false));
        listings.add(demoListing("Badminton racket", "Lightweight racket with a fresh grip, great for casual games.",
                "0", ListingCondition.FAIR, ListingType.GIVEAWAY, "sports-and-fitness", savedSellers.get(2),
                "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=900&q=80", false, false, false));
        listings.add(demoListing("Electric kettle", "Quick-boil kettle, recently descaled and in excellent working order.",
                "500", ListingCondition.GOOD, ListingType.SALE, "appliances", savedSellers.get(0),
                "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=80", false, true, true));
        listingRepository.saveAll(listings);
        log.info("Seeded clearly identified demo listings");
    }

    private User getOrCreateDemoSeller(DemoSeller demoSeller, University university) {
        return userRepository.findByEmailIgnoreCase(demoSeller.email()).orElseGet(() -> {
            User seller = new User(demoSeller.name(), demoSeller.email(),
                    passwordEncoder.encode(UUID.randomUUID().toString()), Role.STUDENT);
            seller.setEmailVerified(true);
            seller.setStudentVerified(true);
            seller.setStatus(UserStatus.VERIFIED);
            seller.setUniversity(university);
            return userRepository.save(seller);
        });
    }

    private Listing demoListing(String title, String description, String price, ListingCondition condition,
                               ListingType type, String categorySlug, User seller, String imageUrl,
                               boolean popular, boolean studentDeal, boolean hostelClearance) {
        Category category = categoryRepository.findBySlug(categorySlug)
                .orElseThrow(() -> new IllegalStateException("Missing demo listing category: " + categorySlug));
        Listing listing = new Listing(title, description, new BigDecimal(price), condition, type,
                imageUrl, category, seller);
        listing.setDemo(true);
        listing.setPopular(popular);
        listing.setStudentDeal(studentDeal);
        listing.setHostelClearance(hostelClearance);
        return listing;
    }

    private record DemoSeller(String name, String email) {}

    private static String slug(String s) {
        return s.toLowerCase(Locale.ROOT).replace("&", "and").replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    }
}

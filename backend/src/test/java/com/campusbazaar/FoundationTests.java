package com.campusbazaar;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;
import com.campusbazaar.repository.ListingRepository;
import com.campusbazaar.entity.ListingStatus;
import com.campusbazaar.exception.BadRequestException;
import com.campusbazaar.service.StudentDiscountPricing;
import com.campusbazaar.service.VerificationDocumentStorage;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FoundationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private VerificationDocumentStorage verificationDocumentStorage;

    @Test
    void verificationDocumentStorageRejectsFilesOverFiveMegabytes() {
        var oversizedDocument = new org.springframework.mock.web.MockMultipartFile(
                "document",
                "student-card.png",
                "image/png",
                new byte[5 * 1024 * 1024 + 1]);
        org.junit.jupiter.api.Assertions.assertThrows(
                BadRequestException.class,
                () -> verificationDocumentStorage.store(oversizedDocument));
    }

    @Test
    void studentDiscountCalculationsUsePreciseDecimalValuesAndRejectInvalidPrices() {
        org.junit.jupiter.api.Assertions.assertEquals(new java.math.BigDecimal("20.00"),
                StudentDiscountPricing.discountPercentage(new java.math.BigDecimal("1000"), new java.math.BigDecimal("800")));
        org.junit.jupiter.api.Assertions.assertEquals(new java.math.BigDecimal("20.00"),
                StudentDiscountPricing.discountPercentage(new java.math.BigDecimal("500"), new java.math.BigDecimal("400")));
        org.junit.jupiter.api.Assertions.assertEquals(new java.math.BigDecimal("25.00"),
                StudentDiscountPricing.discountPercentage(new java.math.BigDecimal("2000"), new java.math.BigDecimal("1500")));

        for (String[] prices : List.of(
                new String[] {"1000", "1000"},
                new String[] {"1000", "1200"},
                new String[] {"0", "1"},
                new String[] {"-1", "1"},
                new String[] {"1000", "0"},
                new String[] {"1000", "-1"})) {
            org.junit.jupiter.api.Assertions.assertThrows(BadRequestException.class,
                    () -> StudentDiscountPricing.discountPercentage(
                            new java.math.BigDecimal(prices[0]), new java.math.BigDecimal(prices[1])));
        }
    }

    @Test
    void healthIsPublic() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("UP"));
    }

    @Test
    void universitiesAreSeededAndPublic() throws Exception {
        mockMvc.perform(get("/api/universities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    void listingsArePublicAndBackedBySeededRecords() throws Exception {
        mockMvc.perform(get("/api/listings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(10))
                .andExpect(jsonPath("$.data[0].demo").value(true))
                .andExpect(jsonPath("$.data[0].seller.verified").value(true))
                .andExpect(jsonPath("$.data[0].seller.studentId").doesNotExist())
                .andExpect(jsonPath("$.data[0].seller.passwordHash").doesNotExist());
    }

    @Test
    void listingDetailsArePublicAndUnknownListingsReturnNotFound() throws Exception {
        mockMvc.perform(get("/api/listings/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.title").isNotEmpty())
                .andExpect(jsonPath("$.data.category.name").isNotEmpty())
                .andExpect(jsonPath("$.data.seller.name").isNotEmpty());

        mockMvc.perform(get("/api/listings/9999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void localDealsArePublicAndAuthenticatedStudentsCanPublishThem() throws Exception {
        mockMvc.perform(get("/api/local-deals"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
        mockMvc.perform(post("/api/local-deals"))
                .andExpect(status().isUnauthorized());

        MvcResult registration = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content("""
                                {
                                  "fullName": "Local Deal Contributor",
                                  "email": "local.deals@example.edu",
                                  "password": "a-strong-password-900",
                                  "studentId": "DEAL-9001",
                                  "universityId": 1
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();
        String token = com.jayway.jsonpath.JsonPath.read(
                registration.getResponse().getContentAsString(), "$.data.accessToken");
        verifyForTest(token);

        mockMvc.perform(post("/api/local-deals")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("""
                                {
                                  "businessName": "Campus Corner Cafe",
                                  "title": "Student lunch combo",
                                  "offer": "15% off with student ID",
                                  "description": "Valid on weekdays. Cannot be combined with other offers.",
                                  "couponCode": "CAMPUS15",
                                  "category": "Food & drink",
                                  "location": "North Gate",
                                  "redemptionUrl": "https://example.com/deals",
                                  "validUntil": "2099-12-31"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.businessName").value("Campus Corner Cafe"))
                .andExpect(jsonPath("$.data.offer").value("15% off with student ID"))
                .andExpect(jsonPath("$.data.couponCode").value("CAMPUS15"))
                .andExpect(jsonPath("$.data.submittedBy").value("Local Deal Contributor"));

        mockMvc.perform(get("/api/local-deals"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].title").value("Student lunch combo"));
    }

    @Test
    @Transactional
    void studentsCanPublishAndSearchCampusServices() throws Exception {
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.slug == 'services-tutoring')].parentName").value("Services"));

        MvcResult registration = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content("""
                                {
                                  "fullName": "Campus Tutor",
                                  "email": "campus.tutor@example.edu",
                                  "password": "a-strong-password-800",
                                  "studentId": "SERV-8001",
                                  "universityId": 1
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();
        String token = com.jayway.jsonpath.JsonPath.read(
                registration.getResponse().getContentAsString(), "$.data.accessToken");
        verifyForTest(token);

        mockMvc.perform(post("/api/listings")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("""
                                {
                                  "title": "Calculus tutoring",
                                  "description": "Peer tutoring for first-year calculus.",
                                  "condition": "GOOD",
                                  "listingType": "SERVICE",
                                  "categorySlug": "services-tutoring"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.listingType").value("SERVICE"))
                .andExpect(jsonPath("$.data.price").value(0))
                .andExpect(jsonPath("$.data.category.name").value("Tutoring"));

        mockMvc.perform(get("/api/listings/search").param("listingType", "SERVICE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].listingType").value("SERVICE"));
    }

    @Test
    @Transactional
    void studentsCanReviewListingsOnceAndReviewsAggregateForListingsAndSellers() throws Exception {
        MvcResult sellerRegistration = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content("""
                                {
                                  "fullName": "Review Seller",
                                  "email": "review.seller@example.edu",
                                  "password": "a-strong-password-678",
                                  "studentId": "REV-SELL-01",
                                  "universityId": 1
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();
        String sellerToken = com.jayway.jsonpath.JsonPath.read(
                sellerRegistration.getResponse().getContentAsString(), "$.data.accessToken");
        verifyForTest(sellerToken);

        MvcResult listingResult = mockMvc.perform(post("/api/listings")
                        .header("Authorization", "Bearer " + sellerToken)
                        .contentType("application/json")
                        .content("""
                                {
                                  "title": "Reviewable Calculus Book",
                                  "description": "A well-kept textbook.",
                                  "price": 300,
                                  "condition": "GOOD",
                                  "listingType": "SALE",
                                  "categorySlug": "academic-books"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        String listingId = com.jayway.jsonpath.JsonPath.read(
                listingResult.getResponse().getContentAsString(), "$.data.id").toString();

        MvcResult reviewerRegistration = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content("""
                                {
                                  "fullName": "Review Author",
                                  "email": "review.author@example.edu",
                                  "password": "a-strong-password-679",
                                  "studentId": "REV-AUTH-01",
                                  "universityId": 1
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();
        String reviewerToken = com.jayway.jsonpath.JsonPath.read(
                reviewerRegistration.getResponse().getContentAsString(), "$.data.accessToken");
        verifyForTest(reviewerToken);

        mockMvc.perform(get("/api/listings/" + listingId + "/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reviews.length()").value(0))
                .andExpect(jsonPath("$.data.listingReviewCount").value(0))
                .andExpect(jsonPath("$.data.hasReviewed").value(false));

        mockMvc.perform(post("/api/listings/" + listingId + "/reviews")
                        .header("Authorization", "Bearer " + reviewerToken)
                        .contentType("application/json")
                        .content("""
                                {"rating": 5, "comment": "Great condition and friendly seller."}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.reviews.length()").value(1))
                .andExpect(jsonPath("$.data.reviews[0].reviewerName").value("Review Author"))
                .andExpect(jsonPath("$.data.reviews[0].rating").value(5))
                .andExpect(jsonPath("$.data.listingAverageRating").value(5.0))
                .andExpect(jsonPath("$.data.listingReviewCount").value(1))
                .andExpect(jsonPath("$.data.sellerAverageRating").value(5.0))
                .andExpect(jsonPath("$.data.sellerReviewCount").value(1))
                .andExpect(jsonPath("$.data.hasReviewed").value(true));

        mockMvc.perform(post("/api/listings/" + listingId + "/reviews")
                        .header("Authorization", "Bearer " + reviewerToken)
                        .contentType("application/json")
                        .content("{\"rating\": 4}"))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/listings/" + listingId + "/reviews")
                        .header("Authorization", "Bearer " + reviewerToken)
                        .contentType("application/json")
                        .content("{\"rating\": 6}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/listings/" + listingId + "/reviews")
                        .header("Authorization", "Bearer " + sellerToken)
                        .contentType("application/json")
                        .content("{\"rating\": 5}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/listings/" + listingId + "/reviews")
                        .contentType("application/json")
                        .content("{\"rating\": 5}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void creatingListingsRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/listings")).andExpect(status().isUnauthorized());
    }

    @Test
    @Transactional
    void categoriesArePublicAndListingCreationPersistsForTheAuthenticatedSeller() throws Exception {
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.slug == 'academic-books')]").exists());

        String registration = """
                {
                  "fullName": "Listing Owner",
                  "email": "listing.owner@example.edu",
                  "password": "a-strong-password-234",
                  "studentId": "LIST-5521",
                  "universityId": 1
                }
                """;
        MvcResult registrationResult = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(registration))
                .andExpect(status().isOk())
                .andReturn();
        String token = com.jayway.jsonpath.JsonPath.read(
                registrationResult.getResponse().getContentAsString(), "$.data.accessToken");
        verifyForTest(token);

        String listingRequest = """
                {
                  "title": "Used Physics Textbook",
                  "description": "Good condition, pages are clean.",
                  "price": 425.50,
                  "condition": "GOOD",
                  "listingType": "SALE",
                  "categorySlug": "academic-books"
                }
                """;
        MvcResult createResult = mockMvc.perform(post("/api/listings")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(listingRequest))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("Used Physics Textbook"))
                .andExpect(jsonPath("$.data.price").value(425.50))
                .andExpect(jsonPath("$.data.condition").value("GOOD"))
                .andExpect(jsonPath("$.data.listingType").value("SALE"))
                .andExpect(jsonPath("$.data.status").value("AVAILABLE"))
                .andExpect(jsonPath("$.data.demo").value(false))
                .andExpect(jsonPath("$.data.category.name").value("Books"))
                .andExpect(jsonPath("$.data.seller.name").value("Listing Owner"))
                .andExpect(jsonPath("$.data.seller.studentId").doesNotExist())
                .andReturn();

        String listingId = com.jayway.jsonpath.JsonPath.read(
                createResult.getResponse().getContentAsString(), "$.data.id").toString();
        mockMvc.perform(get("/api/listings/" + listingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Used Physics Textbook"));
    }

    @Test
    @Transactional
    void giveawayListingIsPersistedAtZeroPriceAndSaleRequiresPositivePrice() throws Exception {
        String registration = """
                {
                  "fullName": "Giveaway Owner",
                  "email": "giveaway.owner@example.edu",
                  "password": "a-strong-password-345",
                  "studentId": "GIVE-5522",
                  "universityId": 1
                }
                """;
        MvcResult registrationResult = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(registration))
                .andExpect(status().isOk())
                .andReturn();
        String token = com.jayway.jsonpath.JsonPath.read(
                registrationResult.getResponse().getContentAsString(), "$.data.accessToken");
        verifyForTest(token);

        mockMvc.perform(post("/api/listings")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("""
                                {
                                  "title": "Free Notebook",
                                  "description": "Unused notebook for pickup.",
                                  "condition": "LIKE_NEW",
                                  "listingType": "GIVEAWAY",
                                  "categorySlug": "academic-books"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.price").value(0))
                .andExpect(jsonPath("$.data.listingType").value("GIVEAWAY"));

        mockMvc.perform(post("/api/listings")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("""
                                {
                                  "title": "Priceless Book",
                                  "description": "No valid sale price provided.",
                                  "price": 0,
                                  "condition": "GOOD",
                                  "listingType": "SALE",
                                  "categorySlug": "academic-books"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Transactional
    void listingSearchFiltersSortsAndPaginatesDatabaseResults() throws Exception {
        String token = registerForTest("search.owner@example.edu", "SEARCH-5111");
        for (int price : List.of(875, 125, 425)) {
            mockMvc.perform(post("/api/listings")
                            .header("Authorization", "Bearer " + token)
                            .contentType("application/json")
                            .content("""
                                    {
                                      "title":"Pageable campus item",
                                      "description":"Searchable listing created for pagination coverage.",
                                      "price":%d,
                                      "condition":"GOOD",
                                      "listingType":"SALE",
                                      "categorySlug":"academic-books"
                                    }
                                    """.formatted(price)))
                    .andExpect(status().isCreated());
        }
        mockMvc.perform(post("/api/listings")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("""
                                {
                                  "title":"Hostel clearance lamp",
                                  "description":"Compact lamp available during move-out.",
                                  "price":250,
                                  "condition":"GOOD",
                                  "listingType":"SALE",
                                  "categorySlug":"hostel",
                                  "hostelClearance":true
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.hostelClearance").value(true));

        mockMvc.perform(get("/api/listings/search")
                        .param("q", "Hostel clearance lamp")
                        .param("hostelClearanceOnly", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].hostelClearance").value(true));

        mockMvc.perform(get("/api/listings/search")
                        .param("q", "Hostel clearance lamp")
                        .param("hostelClearanceOnly", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1));

        mockMvc.perform(get("/api/listings/search")
                        .param("q", "Pageable campus")
                        .param("category", "academic")
                        .param("minPrice", "100")
                        .param("maxPrice", "900")
                        .param("sort", "price_asc")
                        .param("page", "0")
                        .param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].price").value(125))
                .andExpect(jsonPath("$.data.totalElements").value(3))
                .andExpect(jsonPath("$.data.totalPages").value(3))
                .andExpect(jsonPath("$.data.first").value(true))
                .andExpect(jsonPath("$.data.last").value(false));

        mockMvc.perform(get("/api/listings/search")
                        .param("q", "Pageable campus")
                        .param("category", "academic")
                        .param("sort", "price_desc")
                        .param("page", "1")
                        .param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].price").value(425))
                .andExpect(jsonPath("$.data.page").value(1));
    }

    @Test
    @Transactional
    void listingOwnerCanEditAndSoftDeleteOnlyTheirOwnListing() throws Exception {
        String ownerToken = registerForTest("owner.crud@example.edu", "CRUD-5112");
        String otherToken = registerForTest("other.crud@example.edu", "CRUD-5113");
        MvcResult created = mockMvc.perform(post("/api/listings")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType("application/json")
                        .content("""
                                {
                                  "title":"Original owner listing",
                                  "description":"Listing created for ownership checks.",
                                  "price":350,
                                  "condition":"GOOD",
                                  "listingType":"SALE",
                                  "categorySlug":"academic-books"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        Long id = ((Number) com.jayway.jsonpath.JsonPath.read(
                created.getResponse().getContentAsString(), "$.data.id")).longValue();
        String update = """
                {
                  "title":"Updated owner listing",
                  "description":"Updated by the verified owner.",
                  "price":450,
                  "condition":"LIKE_NEW",
                  "listingType":"SALE",
                  "categorySlug":"academic-books"
                }
                """;

        mockMvc.perform(put("/api/listings/" + id)
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType("application/json")
                        .content(update))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/listings/" + id).header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/listings/" + id)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType("application/json")
                        .content(update))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Updated owner listing"))
                .andExpect(jsonPath("$.data.price").value(450));
        mockMvc.perform(delete("/api/listings/" + id).header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/listings/" + id)).andExpect(status().isNotFound());
        org.junit.jupiter.api.Assertions.assertEquals(
                ListingStatus.REMOVED, listingRepository.findById(id).orElseThrow().getStatus());
    }

    @Test
    @Transactional
    void studentDiscountsAreOwnerManagedAndOnlyExposedToVerifiedStudents() throws Exception {
        String ownerToken = registerForTest("discount.owner@example.edu", "DISC-6001");
        MvcResult firstCreated = mockMvc.perform(post("/api/listings")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType("application/json")
                        .content(discountListingBody("First discounted listing", "1000", true, "800")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.studentDiscountAvailable").value(true))
                .andExpect(jsonPath("$.data.studentDiscountedPrice").value(800))
                .andExpect(jsonPath("$.data.discountPercentage").value(20))
                .andExpect(jsonPath("$.data.amountSaved").value(200))
                .andReturn();
        Long firstId = ((Number) com.jayway.jsonpath.JsonPath.read(
                firstCreated.getResponse().getContentAsString(), "$.data.id")).longValue();

        assertDiscountHidden(firstId, null);
        MvcResult pendingRegistration = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content("""
                                {
                                  "fullName":"Pending Deal Viewer",
                                  "email":"discount.pending@example.edu",
                                  "password":"a-strong-password-604",
                                  "studentId":"DISC-6004",
                                  "universityId":1
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();
        String pendingToken = com.jayway.jsonpath.JsonPath.read(
                pendingRegistration.getResponse().getContentAsString(), "$.data.accessToken");
        assertDiscountHidden(firstId, pendingToken);

        MvcResult rejectedRegistration = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content("""
                                {
                                  "fullName":"Rejected Deal Viewer",
                                  "email":"discount.rejected@example.edu",
                                  "password":"a-strong-password-605",
                                  "studentId":"DISC-6005",
                                  "universityId":1
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();
        String rejectedToken = com.jayway.jsonpath.JsonPath.read(
                rejectedRegistration.getResponse().getContentAsString(), "$.data.accessToken");
        Long rejectedRequestId = submitVerificationForTest(rejectedToken);
        String adminToken = com.jayway.jsonpath.JsonPath.read(
                mockMvc.perform(post("/api/auth/login")
                                .contentType("application/json")
                                .content("""
                                        {"email":"admin@campusbazaar.demo","password":"ChangeMe@123"}
                                        """))
                        .andExpect(status().isOk()).andReturn().getResponse().getContentAsString(),
                "$.data.accessToken");
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                        "/api/admin/verifications/" + rejectedRequestId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content("{\"status\":\"REJECTED\",\"rejectionReason\":\"Please upload a clearer card.\"}"))
                .andExpect(status().isOk());
        assertDiscountHidden(firstId, rejectedToken);

        String otherToken = registerForTest("discount.other@example.edu", "DISC-6002");
        mockMvc.perform(put("/api/listings/" + firstId)
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType("application/json")
                        .content(discountListingBody("Unauthorized update", "1000", true, "500")))
                .andExpect(status().isForbidden());

        for (String[] prices : List.of(
                new String[] {"1000", "1000"}, new String[] {"1000", "1200"},
                new String[] {"0", "1"}, new String[] {"1000", "0"},
                new String[] {"1000", "-1"})) {
            mockMvc.perform(post("/api/listings")
                            .header("Authorization", "Bearer " + ownerToken)
                            .contentType("application/json")
                            .content(discountListingBody("Invalid discount", prices[0], true, prices[1])))
                    .andExpect(status().isBadRequest());
        }

        mockMvc.perform(post("/api/listings")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType("application/json")
                        .content(discountListingBody("Second discounted listing", "2000", true, "1500")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.discountPercentage").value(25));

        mockMvc.perform(get("/api/listings/search")
                        .param("studentDiscountsOnly", "true")
                        .param("sort", "student_price_asc")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.items[0].studentDiscountedPrice").doesNotExist())
                .andExpect(jsonPath("$.data.items[0].price").value(1000))
                .andExpect(jsonPath("$.data.items[1].price").value(2000));
        mockMvc.perform(get("/api/listings/search")
                        .param("sort", "discount_desc")
                        .param("size", "10")
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].price").value(2000))
                .andExpect(jsonPath("$.data.items[0].studentDiscountedPrice").value(1500));

        mockMvc.perform(put("/api/listings/" + firstId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType("application/json")
                        .content(discountListingBody("First discounted listing", "1000", true, "750")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.studentDiscountedPrice").value(750))
                .andExpect(jsonPath("$.data.discountPercentage").value(25));
        mockMvc.perform(put("/api/listings/" + firstId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType("application/json")
                        .content("""
                                {
                                  "title":"First discounted listing",
                                  "description":"Legacy listing update remains compatible.",
                                  "price":900,
                                  "condition":"GOOD",
                                  "listingType":"SALE",
                                  "categorySlug":"academic-books"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.studentDiscountedPrice").value(750))
                .andExpect(jsonPath("$.data.discountPercentage").value(16.67));
        mockMvc.perform(put("/api/listings/" + firstId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType("application/json")
                        .content(discountListingBody("First discounted listing", "1000", false, "null")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.studentDiscountAvailable").value(false))
                .andExpect(jsonPath("$.data.studentDiscountedPrice").doesNotExist());
        mockMvc.perform(get("/api/listings/search").param("studentDiscountsOnly", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1));
    }

    private void assertDiscountHidden(Long listingId, String token) throws Exception {
        var request = get("/api/listings/" + listingId);
        if (token != null) request.header("Authorization", "Bearer " + token);
        mockMvc.perform(request)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.studentDiscountAvailable").value(true))
                .andExpect(jsonPath("$.data.studentDiscountEligible").value(false))
                .andExpect(jsonPath("$.data.studentDiscountedPrice").doesNotExist())
                .andExpect(jsonPath("$.data.discountPercentage").doesNotExist())
                .andExpect(jsonPath("$.data.amountSaved").doesNotExist());
    }

    private String discountListingBody(String title, String originalPrice, boolean enabled, String discountedPrice) {
        return """
                {
                  "title":"%s",
                  "description":"Student discount test listing.",
                  "price":%s,
                  "condition":"GOOD",
                  "listingType":"SALE",
                  "categorySlug":"academic-books",
                  "studentDiscountEnabled":%s,
                  "studentDiscountedPrice":%s
                }
                """.formatted(title, originalPrice, enabled, discountedPrice);
    }

    @Test
    @Transactional
    void campusBoardPostsAreCampusScopedAndOwnerManaged() throws Exception {
        mockMvc.perform(get("/api/campus-board")).andExpect(status().isUnauthorized());

        String ownerToken = registerForTest("board.owner@example.edu", "BOARD-5114");
        String otherToken = registerForTest("board.other@example.edu", "BOARD-5115", 2L);
        mockMvc.perform(get("/api/campus-board").header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));
        String postBody = """
                {
                  "title":"Found a blue water bottle",
                  "description":"Found near the library entrance after class.",
                  "location":"Library entrance",
                  "type":"FOUND"
                }
                """;

        mockMvc.perform(post("/api/campus-board")
                        .contentType("application/json")
                        .content(postBody))
                .andExpect(status().isUnauthorized());

        MvcResult created = mockMvc.perform(post("/api/campus-board")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType("application/json")
                        .content(postBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.type").value("FOUND"))
                .andExpect(jsonPath("$.data.status").value("OPEN"))
                .andExpect(jsonPath("$.data.universityName").isNotEmpty())
                .andExpect(jsonPath("$.data.studentId").doesNotExist())
                .andReturn();
        Long postId = ((Number) com.jayway.jsonpath.JsonPath.read(
                created.getResponse().getContentAsString(), "$.data.id")).longValue();

        mockMvc.perform(get("/api/campus-board").header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                        "/api/campus-board/" + postId + "/resolve")
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                        "/api/campus-board/" + postId + "/resolve")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("RESOLVED"));
        mockMvc.perform(get("/api/campus-board").header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1));
        mockMvc.perform(delete("/api/campus-board/" + postId).header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/campus-board").header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void conversationsMessagesAndNotificationsArePersistedAndScopedToParticipants() throws Exception {
        String sellerToken = registerForTest("chat.seller@example.edu", "CHAT-2001");
        String createListing = """
                {
                  "title": "Chat Test Textbook",
                  "description": "Available for a campus handover.",
                  "price": 300,
                  "condition": "GOOD",
                  "listingType": "SALE",
                  "categorySlug": "academic-books"
                }
                """;
        MvcResult listingResult = mockMvc.perform(post("/api/listings")
                        .header("Authorization", "Bearer " + sellerToken)
                        .contentType("application/json")
                        .content(createListing))
                .andExpect(status().isCreated())
                .andReturn();
        String listingId = com.jayway.jsonpath.JsonPath.read(
                listingResult.getResponse().getContentAsString(), "$.data.id").toString();

        String buyerToken = registerForTest("chat.buyer@example.edu", "CHAT-2002");
        MvcResult conversationResult = mockMvc.perform(post("/api/conversations")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType("application/json")
                        .content("{\"listingId\":" + listingId + "}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.listingTitle").value("Chat Test Textbook"))
                .andExpect(jsonPath("$.data.otherParticipantName").value("Test Student"))
                .andReturn();
        String conversationId = com.jayway.jsonpath.JsonPath.read(
                conversationResult.getResponse().getContentAsString(), "$.data.id").toString();

        mockMvc.perform(post("/api/conversations/" + conversationId + "/messages")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType("application/json")
                        .content("""
                                {"content":"Hi, is the textbook still available?"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.senderName").value("Test Student"))
                .andExpect(jsonPath("$.data.content").value("Hi, is the textbook still available?"));

        MvcResult notificationResult = mockMvc.perform(get("/api/notifications")
                        .param("page", "0").param("size", "10")
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount").value(1))
                .andExpect(jsonPath("$.data.items[0].conversationId").value(Long.valueOf(conversationId)))
                .andExpect(jsonPath("$.data.items[0].relatedEntityId").isNotEmpty())
                .andExpect(jsonPath("$.data.items[0].title").value("New message"))
                .andExpect(jsonPath("$.data.page").value(0))
                .andExpect(jsonPath("$.data.pageSize").value(10))
                .andReturn();
        Long notificationId = ((Number) com.jayway.jsonpath.JsonPath.read(
                notificationResult.getResponse().getContentAsString(), "$.data.items[0].id")).longValue();
        mockMvc.perform(get("/api/notifications/unread-count").header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.count").value(1));

        mockMvc.perform(get("/api/conversations/" + conversationId + "/messages")
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].content").value("Hi, is the textbook still available?"));

        mockMvc.perform(get("/api/notifications").header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount").value(0));

        String outsiderToken = registerForTest("chat.outsider@example.edu", "CHAT-2003");
        mockMvc.perform(get("/api/notifications").header("Authorization", "Bearer " + outsiderToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].type").value("STUDENT_VERIFICATION"))
                .andExpect(jsonPath("$.data.items[0].type").value(org.hamcrest.Matchers.not("MESSAGE")))
                .andExpect(jsonPath("$.data.unreadCount").value(0));
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                        "/api/notifications/" + notificationId + "/read")
                        .header("Authorization", "Bearer " + outsiderToken))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/notifications/" + notificationId)
                        .header("Authorization", "Bearer " + outsiderToken))
                .andExpect(status().isNotFound());
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                        "/api/notifications/" + notificationId + "/read")
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount").value(0));
        mockMvc.perform(delete("/api/notifications/" + notificationId)
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/notifications").header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].type").value("STUDENT_VERIFICATION"));
        mockMvc.perform(get("/api/conversations/" + conversationId + "/messages")
                        .header("Authorization", "Bearer " + outsiderToken))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/conversations/" + conversationId + "/messages")
                        .header("Authorization", "Bearer " + outsiderToken)
                        .contentType("application/json")
                        .content("{\"content\":\"Unauthorized message\"}"))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/conversations")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/notifications/unread-count")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/notifications/stream")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/conversations/" + conversationId + "/messages")
                        .header("Authorization", "Bearer " + sellerToken + ".tampered"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminEndpointsRequireRoleAndEnforceAccountAndListingActions() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard")).andExpect(status().isUnauthorized());

        MvcResult studentRegistration = mockMvc.perform(post("/api/auth/register")
                .contentType("application/json")
                .content("""
                        {
                          "fullName": "Admin Permission Test",
                          "email": "admin.permission@example.edu",
                          "password": "a-strong-password-678",
                          "studentId": "ADMIN-8877",
                          "universityId": 1
                        }
                        """))
                .andExpect(status().isOk())
                .andReturn();
        String studentToken = com.jayway.jsonpath.JsonPath.read(
                studentRegistration.getResponse().getContentAsString(), "$.data.accessToken");
        Number studentIdValue = com.jayway.jsonpath.JsonPath.read(
                studentRegistration.getResponse().getContentAsString(), "$.data.user.id");
        Long studentId = studentIdValue.longValue();

        mockMvc.perform(get("/api/admin/dashboard").header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        MvcResult adminLogin = mockMvc.perform(post("/api/auth/login")
                .contentType("application/json")
                .content("""
                        {"email":"admin@campusbazaar.demo","password":"ChangeMe@123"}
                        """))
                .andExpect(status().isOk())
                .andReturn();
        String adminToken = com.jayway.jsonpath.JsonPath.read(
                adminLogin.getResponse().getContentAsString(), "$.data.accessToken");

        mockMvc.perform(get("/api/admin/dashboard").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalUsers").isNumber())
                .andExpect(jsonPath("$.data.openReports").isNumber());
        mockMvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.email == 'admin.permission@example.edu')].studentId").doesNotExist())
                .andExpect(jsonPath("$.data[?(@.email == 'admin.permission@example.edu')].maskedStudentId").exists());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                "/api/admin/verifications/1")
                .header("Authorization", "Bearer " + studentToken)
                .contentType("application/json")
                .content("{\"status\":\"VERIFIED\"}"))
                .andExpect(status().isForbidden());

        Long verificationRequestId = submitVerificationForTest(studentToken);
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                "/api/admin/verifications/" + verificationRequestId)
                .header("Authorization", "Bearer " + adminToken)
                .contentType("application/json")
                .content("{\"status\":\"VERIFIED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("VERIFIED"))
                .andExpect(jsonPath("$.data.maskedStudentId").value("******8877"));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                "/api/admin/users/" + studentId + "/suspend")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SUSPENDED"));
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                "/api/admin/users/" + studentId + "/reinstate")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("VERIFIED"));
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/reports")
                .header("Authorization", "Bearer " + studentToken)
                .contentType("application/json")
                .content("""
                        {"listingId":1,"reason":"Listing details appear to be misleading."}
                        """))
                .andExpect(status().isCreated());
        MvcResult reportResult = mockMvc.perform(get("/api/admin/reports")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].status").value("OPEN"))
                .andReturn();
        String reportId = com.jayway.jsonpath.JsonPath.read(
                reportResult.getResponse().getContentAsString(), "$.data[0].id").toString();
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                "/api/admin/reports/" + reportId)
                .header("Authorization", "Bearer " + adminToken)
                .contentType("application/json")
                .content("{\"status\":\"DISMISSED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("DISMISSED"));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                "/api/admin/listings/1/moderation")
                .header("Authorization", "Bearer " + adminToken)
                .contentType("application/json")
                .content("{\"status\":\"REMOVED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REMOVED"));
        mockMvc.perform(get("/api/listings/1")).andExpect(status().isNotFound());
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                "/api/admin/listings/1/moderation")
                .header("Authorization", "Bearer " + adminToken)
                .contentType("application/json")
                .content("{\"status\":\"AVAILABLE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("AVAILABLE"));
    }

    @Test
    @Transactional
    void wishlistIsPersistentAuthenticatedAndScopedToTheCurrentUser() throws Exception {
        mockMvc.perform(get("/api/wishlist")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/wishlist/1")).andExpect(status().isUnauthorized());

        String ownerToken = registerForTest("wishlist.owner@example.edu", "WISH-7011");
        String otherToken = registerForTest("wishlist.other@example.edu", "WISH-7012");

        mockMvc.perform(post("/api/wishlist/1").header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.listing.id").value(1))
                .andExpect(jsonPath("$.data.available").value(true));
        mockMvc.perform(post("/api/wishlist/1").header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isConflict());
        mockMvc.perform(get("/api/wishlist").header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].listing.id").value(1));
        mockMvc.perform(get("/api/wishlist").header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));
        mockMvc.perform(get("/api/wishlist/check/1").header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.saved").value(true));

        mockMvc.perform(delete("/api/wishlist/1").header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/wishlist/check/1").header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.saved").value(true));
        mockMvc.perform(delete("/api/wishlist/1").header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/wishlist").header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));

        mockMvc.perform(post("/api/wishlist/999999").header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNotFound());

        MvcResult createdListing = mockMvc.perform(post("/api/listings")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType("application/json")
                        .content("""
                                {
                                  "title":"Listing removed after saving",
                                  "description":"Availability should remain visible in existing wishlists.",
                                  "price":125,
                                  "condition":"GOOD",
                                  "listingType":"SALE",
                                  "categorySlug":"academic-books"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        Long unavailableId = ((Number) com.jayway.jsonpath.JsonPath.read(
                createdListing.getResponse().getContentAsString(), "$.data.id")).longValue();
        mockMvc.perform(delete("/api/listings/" + unavailableId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNoContent());
        mockMvc.perform(post("/api/wishlist/" + unavailableId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isBadRequest());
    }

    private String registerForTest(String email, String studentId) throws Exception {
        return registerForTest(email, studentId, 1L);
    }

    private String registerForTest(String email, String studentId, Long universityId) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content("""
                                {
                                  "fullName": "Test Student",
                                  "email": "%s",
                                  "password": "a-strong-password-456",
                                  "studentId": "%s",
                                  "universityId": %d
                                }
                                """.formatted(email, studentId, universityId)))
                .andExpect(status().isOk())
                .andReturn();
        String token = com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), "$.data.accessToken");
        verifyForTest(token);
        return token;
    }

    private Long submitVerificationForTest(String studentToken) throws Exception {
        byte[] pngSignature = new byte[] {
                (byte) 0x89, 'P', 'N', 'G', 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0
        };
        MvcResult result = mockMvc.perform(
                        org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .multipart("/api/verifications/me/document")
                                .file(new org.springframework.mock.web.MockMultipartFile(
                                        "document", "student-card.png", "image/png", pngSignature))
                                .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andReturn();
        return ((Number) com.jayway.jsonpath.JsonPath.read(
                result.getResponse().getContentAsString(), "$.data.history[0].id")).longValue();
    }

    private void verifyForTest(String studentToken) throws Exception {
        Long requestId = submitVerificationForTest(studentToken);
        MvcResult adminLogin = mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"admin@campusbazaar.demo","password":"ChangeMe@123"}
                                """))
                .andExpect(status().isOk())
                .andReturn();
        String adminToken = com.jayway.jsonpath.JsonPath.read(
                adminLogin.getResponse().getContentAsString(), "$.data.accessToken");
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                        "/api/admin/verifications/" + requestId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content("{\"status\":\"VERIFIED\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                        "/api/notifications/read-all")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk());
    }

    @Test
    @Transactional
    void verificationDocumentsArePrivateAndMarketplaceActionsRequireVerification() throws Exception {
        MvcResult registration = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content("""
                                {
                                  "fullName": "Pending Verification Student",
                                  "email": "pending.verification@example.edu",
                                  "password": "a-strong-password-901",
                                  "studentId": "PEND-9001",
                                  "universityId": 1
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.status").value("PENDING_STUDENT_VERIFICATION"))
                .andExpect(jsonPath("$.data.user.maskedStudentId").value("*****9001"))
                .andReturn();
        String studentToken = com.jayway.jsonpath.JsonPath.read(
                registration.getResponse().getContentAsString(), "$.data.accessToken");

        mockMvc.perform(get("/api/verifications/me")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.canSubmitDocument").value(true))
                .andExpect(jsonPath("$.data.maskedStudentId").value("*****9001"))
                .andExpect(jsonPath("$.data.history.length()").value(0));

        mockMvc.perform(post("/api/listings")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType("application/json")
                        .content("""
                                {
                                  "title":"Blocked listing",
                                  "description":"Unverified accounts cannot publish.",
                                  "price":100,
                                  "condition":"GOOD",
                                  "listingType":"SALE",
                                  "categorySlug":"academic-books"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Student verification is required before performing this action."));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .multipart("/api/verifications/me/document")
                        .file(new org.springframework.mock.web.MockMultipartFile(
                                "document", "student-card.txt", "text/plain", "not a document".getBytes()))
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isBadRequest());

        Long requestId = submitVerificationForTest(studentToken);
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .multipart("/api/verifications/me/document")
                        .file(new org.springframework.mock.web.MockMultipartFile(
                                "document", "student-card.png", "image/png",
                                new byte[] {(byte) 0x89, 'P', 'N', 'G', 0x0d, 0x0a, 0x1a, 0x0a}))
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isConflict());

        MvcResult otherRegistration = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content("""
                                {
                                  "fullName": "Another Student",
                                  "email": "document.other@example.edu",
                                  "password": "a-strong-password-903",
                                  "studentId": "DOC-9002",
                                  "universityId": 1
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();
        String otherToken = com.jayway.jsonpath.JsonPath.read(
                otherRegistration.getResponse().getContentAsString(), "$.data.accessToken");
        mockMvc.perform(get("/api/verifications/me/document").header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/admin/verifications/" + requestId + "/document")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        MvcResult adminLogin = mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"admin@campusbazaar.demo","password":"ChangeMe@123"}
                                """))
                .andExpect(status().isOk())
                .andReturn();
        String adminToken = com.jayway.jsonpath.JsonPath.read(
                adminLogin.getResponse().getContentAsString(), "$.data.accessToken");
        mockMvc.perform(get("/api/admin/verifications")
                        .param("status", "PENDING")
                        .param("q", "Pending Verification")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/verifications")
                        .param("status", "PENDING")
                        .param("q", "Pending Verification")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].maskedStudentId").value("*****9001"))
                .andExpect(jsonPath("$.data[0].studentName").value("Pending Verification Student"));
        mockMvc.perform(get("/api/admin/verifications/" + requestId + "/document")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .content().contentType("image/png"));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                        "/api/admin/verifications/" + requestId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content("{\"status\":\"VERIFIED\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                        "/api/notifications/read-all")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/listings")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType("application/json")
                        .content("""
                                {
                                  "title":"Allowed verified listing",
                                  "description":"Published after document review.",
                                  "price":100,
                                  "condition":"GOOD",
                                  "listingType":"SALE",
                                  "categorySlug":"academic-books"
                                }
                                """))
                .andExpect(status().isCreated());
        mockMvc.perform(get("/api/notifications").header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].type").value("STUDENT_VERIFICATION"))
                .andExpect(jsonPath("$.data.items[0].targetUrl").value("/verification"));
    }

    @Test
    @Transactional
    void rejectedStudentsCanResubmitAndReceiveDecisionNotifications() throws Exception {
        MvcResult registration = mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content("""
                                {
                                  "fullName": "Resubmitting Student",
                                  "email": "resubmit.student@example.edu",
                                  "password": "a-strong-password-902",
                                  "studentId": "RESUB-9002",
                                  "universityId": 1
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();
        String studentToken = com.jayway.jsonpath.JsonPath.read(
                registration.getResponse().getContentAsString(), "$.data.accessToken");
        Long studentAccountId = ((Number) com.jayway.jsonpath.JsonPath.read(
                registration.getResponse().getContentAsString(), "$.data.user.id")).longValue();
        Long firstRequestId = submitVerificationForTest(studentToken);
        MvcResult adminLogin = mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"admin@campusbazaar.demo","password":"ChangeMe@123"}
                                """))
                .andExpect(status().isOk())
                .andReturn();
        String adminToken = com.jayway.jsonpath.JsonPath.read(
                adminLogin.getResponse().getContentAsString(), "$.data.accessToken");

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                        "/api/admin/verifications/" + firstRequestId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content("{\"status\":\"REJECTED\",\"rejectionReason\":\"Please upload a clearer card image.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REJECTED"));
        mockMvc.perform(get("/api/verifications/me").header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REJECTED"))
                .andExpect(jsonPath("$.data.rejectionReason").value("Please upload a clearer card image."))
                .andExpect(jsonPath("$.data.canSubmitDocument").value(true));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                        "/api/admin/users/" + studentAccountId + "/suspend")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                        "/api/admin/users/" + studentAccountId + "/reinstate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REJECTED"));

        Long secondRequestId = submitVerificationForTest(studentToken);
        org.junit.jupiter.api.Assertions.assertNotEquals(firstRequestId, secondRequestId);
        mockMvc.perform(get("/api/verifications/me").header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.history.length()").value(2))
                .andExpect(jsonPath("$.data.history[1].rejectionReason").value("Please upload a clearer card image."));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                        "/api/admin/verifications/" + secondRequestId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType("application/json")
                        .content("{\"status\":\"VERIFIED\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/notifications").header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount").value(2))
                .andExpect(jsonPath("$.data.items[0].type").value("STUDENT_VERIFICATION"));
    }

    @Test
    void registrationLoginAndCurrentUserUseSafeStudentProfile() throws Exception {
        String registration = """
                {
                  "fullName": "Test Student",
                  "email": "student.auth@example.edu",
                  "password": "a-strong-password-123",
                  "studentId": "STU-7766",
                  "universityId": 1
                }
                """;
        mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(registration))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.user.email").value("student.auth@example.edu"))
                .andExpect(jsonPath("$.data.user.status").value("PENDING_STUDENT_VERIFICATION"))
                .andExpect(jsonPath("$.data.user.studentVerified").value(false))
                .andExpect(jsonPath("$.data.user.maskedStudentId").value("****7766"))
                .andExpect(jsonPath("$.data.user.studentId").doesNotExist())
                .andExpect(jsonPath("$.data.user.passwordHash").doesNotExist());

        String login = """
                {
                  "email": "STUDENT.AUTH@example.edu",
                  "password": "a-strong-password-123"
                }
                """;
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(login))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.user.email").value("student.auth@example.edu"))
                .andReturn();

        String token = com.jayway.jsonpath.JsonPath.read(
                loginResult.getResponse().getContentAsString(), "$.data.accessToken");
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("student.auth@example.edu"))
                .andExpect(jsonPath("$.data.maskedStudentId").value("****7766"))
                .andExpect(jsonPath("$.data.studentId").doesNotExist())
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist());

        mockMvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"student.auth@example.edu","password":"wrong-password"}
                                """))
                .andExpect(status().isUnauthorized());
    }
}

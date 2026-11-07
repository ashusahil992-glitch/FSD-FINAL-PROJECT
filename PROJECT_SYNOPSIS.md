# CampusBazaar Project Synopsis

## Project title

**CampusBazaar: A Student-Only University Marketplace and Campus Community Platform**

## Abstract

CampusBazaar is a web application designed to help university students exchange goods and useful campus information within their academic community. Students can browse marketplace listings, search and filter products, contact sellers, publish and manage their own listings, and report potentially unsafe content. The application also provides a student-oriented campus board for lost-and-found notices and announcements.

The system uses a React frontend and a Spring Boot REST API backed by relational persistence through Spring Data JPA. MySQL is the configured production-style database. Spring Security protects authenticated operations with stateless JWT authentication and server-side ownership and role checks. The application includes additional trust features such as student verification status, verified-seller indicators, moderation reports, notifications, and a protected administrator dashboard.

## Problem statement

Students frequently need affordable textbooks, electronics, furniture, and other campus essentials, while other students have usable items they no longer need. General-purpose marketplaces may not be limited to a university community and can make it harder to find relevant campus listings or establish trust. Campus-specific lost-and-found information and announcements may also be scattered across unrelated channels.

CampusBazaar addresses these issues by bringing student-focused buying, selling, item discovery, communication, moderation, and campus notices together in one application.

## Objectives

- Provide a responsive marketplace experience for browsing campus listings.
- Allow students to discover listings by search term, category, price range, listing type, sort order, and page.
- Enable signed-in students to create, edit, and remove their own listings.
- Support sale, rental, exchange, and giveaway listing types.
- Let interested users contact sellers through persisted conversations and receive message notifications.
- Provide persistent browser-based wishlist selections.
- Support listing reports and administrator moderation.
- Provide university-scoped Lost, Found, and announcement posts.
- Protect account, listing, messaging, reporting, and administration operations through backend authentication and authorization.

## Scope and users

### Student users

Students can register with an account associated with a university, sign in, browse listings, view listing details, manage a browser-local wishlist, contact sellers, report listings, publish and manage their own listings, and use the campus board.

Student registrations start with a pending verification status. Administrators can review student accounts and update verification status. Public listing and user-facing API responses avoid exposing full student IDs and password hashes.

### Administrators

Administrators access a protected dashboard to inspect marketplace summaries, review masked student identity details, verify or suspend student accounts, moderate listings, and review reports. Administrative access is checked by backend role-based authorization; hiding the admin interface in the frontend is not the security boundary.

## Main functional modules

### 1. Marketplace and product discovery

- Public listing cards and detailed listing pages.
- Database-backed categories and available listing data.
- Search by listing text, category, or seller.
- Category filtering, listing type filtering, minimum and maximum price filtering.
- Sorting by newest, lowest price, or highest price.
- Server-side pagination with bounded page size.

### 2. Listing lifecycle

- Authenticated listing creation using active database categories.
- Support for sale, rent, exchange, and giveaway listings.
- Positive prices required for sale and rental listings; exchange and giveaway listings are stored at zero price.
- Owner-checked listing updates.
- Owner-checked soft deletion, preserving the listing record while removing it from public available listings.
- Administrators can separately moderate listings.

### 3. Accounts and trust

- Student registration and login using the backend authentication API.
- Stateless JWT authentication.
- Student accounts have verification and account-status states.
- Verified-student indicators can be displayed with seller information.
- Backend checks account status and listing ownership for protected actions.

### 4. Wishlist

Users can add or remove listings from a wishlist. The current implementation saves wishlist IDs in browser local storage, so they persist across refreshes in that browser. The wishlist is not synchronized to the user's account or across devices.

### 5. Messaging and notifications

- Conversations are associated with listings and their buyer/seller participants.
- Only conversation participants can read or send messages.
- Messages and message notifications are persisted in the configured database.
- The frontend periodically refreshes messages and notifications; it does not currently use WebSockets.

### 6. Reporting and administration

- Signed-in users can report listings.
- Reports are available to administrators rather than being exposed through public listing responses.
- The protected admin dashboard supports student account actions, listing moderation, report review, and marketplace summary counts.
- Suspended accounts are rejected on subsequent authenticated requests.

### 7. Campus board

- Signed-in students view notices scoped to their account's university.
- Post types include Lost item, Found item, and Campus announcement.
- Students can create posts, mark their own open posts resolved, and remove their own posts.
- Campus board responses omit direct contact details and student IDs.

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, JavaScript, Tailwind CSS |
| Frontend state and API | Redux Toolkit, Axios, React Router |
| Backend | Java 17, Spring Boot 3, Spring MVC |
| Persistence | Spring Data JPA / Hibernate |
| Security | Spring Security, JWT bearer tokens, role and ownership checks |
| Database | MySQL configured for normal application use |
| Automated backend testing | Spring Boot integration tests with in-memory H2 |
| Frontend testing | Vitest and React Testing Library |

## System architecture

The application follows a client/server architecture:

1. The React single-page application sends HTTP requests to the backend API.
2. The Spring Boot controllers validate requests and apply endpoint security.
3. Services implement marketplace, account, messaging, moderation, and campus-board business rules.
4. Spring Data repositories persist and retrieve relational entities using JPA.
5. MySQL is the configured persistent database. The automated integration-test profile uses an isolated in-memory H2 database.

The frontend's development server proxies `/api` requests to the Spring Boot server on port 8080.

## Principal data entities

- **User** — account identity, role, account status, student verification status, and university association.
- **University** — university and campus identity used for student accounts and campus-board scope.
- **Category** — active marketplace categories and their parent-child relationships.
- **Listing** — item description, price, condition, type, status, category, and seller.
- **Conversation** and **ChatMessage** — participant-scoped listing conversations and persisted messages.
- **UserNotification** — persisted notifications, including unread message notifications.
- **ListingReport** — user-submitted reports and administrative review status.
- **CampusPost** — university-scoped Lost, Found, or announcement records with open, resolved, or removed status.

## Security and privacy

- Public marketplace reads are separated from authenticated listing mutations.
- Listing updates and removals verify ownership on the backend.
- Campus-board viewing and management require authentication and are restricted to the account's university for reads.
- Administrator endpoints require the administrator role.
- Passwords are stored as password hashes; full student IDs and password hashes are not returned in user-facing API responses.
- JWT signing material is supplied through backend environment configuration and must not be exposed in frontend configuration or source control.
- The local demo administrator credentials are for development only and must be changed for a deployment.

## Verification and current status

The current source was verified with:

- Backend: `mvn clean package` — **13 integration tests passed** using H2.
- Frontend: `npm test -- --run` — **20 tests passed**.
- Frontend: `npm run build` — production build succeeded.
- Isolated H2 runtime checks confirmed public categories and paginated listing search return HTTP 200, unauthenticated listing creation is rejected with HTTP 401, and authenticated listing creation, editing, soft deletion, and campus-post creation/resolution work.
- A disposable, loopback-only MySQL 8.4.9 instance was initialized in a new temporary data directory. The updated backend connected successfully, started on port 8081, created its schema and demo records, and returned HTTP 200 for health, categories, listings, and paginated search.
- Against that temporary MySQL database, authenticated listing creation, detail read-back, owner update, rejection of another owner's update (HTTP 403), and soft deletion were verified. Direct SQL confirmed the updated values and `REMOVED` status. A campus-board post was visible within its university and absent from a second university.
- The backend was restarted against the same temporary MySQL data directory; listing and campus-post records remained in MySQL afterward. The temporary backend and database were stopped and the disposable data directory was removed.

No pre-existing CampusBazaar MySQL data directory, service, or application database was configured on this machine; port 3306 refused connections and no MySQL/MariaDB Windows service was registered. The MySQL checks therefore verified real MySQL compatibility and persistence against a newly created disposable database, not against any pre-existing user database or deployment. No pre-existing records were accessed or changed. Before using the application's normal port 8080 configuration, a persistent MySQL service and its credentials still need to be configured. An earlier backend process on port 8080 was also found to be outdated: its health and listing endpoints returned HTTP 200, but categories returned HTTP 401 and the new search endpoint returned HTTP 500.

## Current limitations

- Listing image selection offers a local preview only; file upload and durable image storage are not implemented.
- Wishlist data is local to the browser rather than stored per account.
- Message and notification updates use polling instead of a live WebSocket connection.
- Connection and persistence against an existing deployment database must be confirmed after its MySQL service and connection configuration are available.
- The campus board currently supports notices and their resolution/removal, not attachments or direct replies.

## Future enhancements

- Add secure image upload and durable image storage.
- Persist wishlists per account and synchronize them between devices.
- Add WebSocket-based messaging and notification delivery.
- Complete live MySQL deployment verification and production configuration review.
- Add richer profile management and student-verification workflows.
- Add further campus services, rental requests, exchange proposals, and deal/coupon workflows.

## Conclusion

CampusBazaar provides an integrated foundation for a university marketplace and student community board. It combines database-backed listings, authenticated owner actions, server-side search and pagination, student trust signals, participant-scoped communication, report moderation, and university-scoped notices. Automated tests, an isolated H2 runtime, and a disposable MySQL 8.4 runtime validate the updated application flows. Verification against any pre-existing CampusBazaar database or deployed MySQL credentials remains outstanding.

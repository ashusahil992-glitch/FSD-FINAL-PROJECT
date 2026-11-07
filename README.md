# CampusBazaar — Buy. Sell. Save. Connect.

Student marketplace and campus community platform.
**Status: Marketplace listings, student services, ratings and reviews, paginated discovery, student accounts, owner-managed listings, buyer–seller messaging, notifications, a campus board, and protected administration are implemented.** Account registration stores a student account as pending verification; the full student ID and password hash are never returned by the authentication API.

## Stack
React + Vite + Tailwind + Redux Toolkit + Axios | Spring Boot 3 (Java 17) + JPA + Spring Security | MySQL

## Prerequisites
Java 17+, Maven 3.9+, Node 18+, and MySQL 8 running locally.

Create the database and a dedicated application user once, using a MySQL administrator account:
```sql
CREATE DATABASE campusbazaar CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'campusbazaar_app'@'localhost' IDENTIFIED BY 'your_strong_password';
CREATE USER 'campusbazaar_app'@'127.0.0.1' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON campusbazaar.* TO 'campusbazaar_app'@'localhost';
GRANT ALL PRIVILEGES ON campusbazaar.* TO 'campusbazaar_app'@'127.0.0.1';
```
Use the same password for both accounts. The app user only needs access to the `campusbazaar` database.

## Run the backend
```bash
cd backend
# macOS/Linux
export DB_USERNAME=campusbazaar_app
export DB_PASSWORD=your_strong_password
# Windows PowerShell:
# $env:DB_USERNAME="campusbazaar_app"
# $env:DB_PASSWORD="your_strong_password"
# Generate a persistent signing secret once and keep it private:
# $env:JWT_SECRET=[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
mvn spring-boot:run
```
The database `campusbazaar` is created automatically. Check http://localhost:8080/api/health, then verify `GET /api/categories` and `GET /api/listings` return HTTP 200. The API uses the standard response envelope with records in `data`.

When `SEED_ENABLED=true`, the backend seeds fictional universities, categories, and clearly labeled demo listings only when their respective tables are empty. Demo listings are stored in the configured database and are returned by the same listing API as future listings.

## Student accounts and verification
The frontend provides `/register` and `/login`. Registration requires a name, email, password (12–64 characters), student ID, an active university from `GET /api/universities`, and a PDF/JPG/JPEG/PNG university ID document up to 5 MB. New accounts remain `PENDING_STUDENT_VERIFICATION`; the backend and verification pages expose only a masked student ID. Documents are stored under `${user.home}/.campusbazaar/private-documents` by default, outside public web paths. Set `VERIFICATION_STORAGE_DIRECTORY` to an absolute private directory to change this location.

Students can view current status and history at `/verification`, retrieve their own document, and resubmit after rejection. APIs are `GET /api/verifications/me`, `GET /api/verifications/me/document`, and multipart `POST /api/verifications/me/document` (form field `document`). A registration upload failure does not invalidate the account; sign in and submit the document from the verification page.

Only admins can use `/admin` to search/filter requests, view private documents and review history, approve a pending request, or reject it with a reason. Admin APIs are under `/api/admin/verifications`; approvals and rejections create in-app notifications. Hibernate `ddl-auto: update` creates/updates the verification request table on startup; there is no separate migration framework configured.

Students must be verified before publishing listings, messaging, posting campus-board content, submitting listing reviews/reports, or submitting local business deals. The backend enforces this for all protected mutations; browsing public marketplace content and accessing verification status remain available while pending.

Signed-in users can publish listings from `/sell`. Category choices come from the active database categories (`GET /api/categories`); listing creation uses authenticated `POST /api/listings` and stores the category and seller relationships in MySQL. Owners can edit their available listings with `PUT /api/listings/{id}` or remove them with `DELETE /api/listings/{id}`; removal is a soft delete that preserves the database record. The backend checks ownership on every mutation. Sale and rental listings require a positive price; exchange and giveaway records are stored at zero. Listing photo selection provides a local preview only; photo uploads are not enabled.

Verified sellers can enable student-only pricing while publishing or editing eligible paid listings. The backend validates the discounted price against the original price and calculates the percentage using decimal arithmetic. Listing responses always include the original price and whether a discount is available; discounted amounts and savings are returned only to viewers whose verified student status is confirmed from the database. Other viewers see the original price and are prompted to verify. Search supports `studentDiscountsOnly=true`, `sort=student_price_asc`, and `sort=discount_desc`; the homepage Student Deals section uses these real listing records.

Listing details show public reviews and average ratings for both the listing and its seller. Authenticated users can leave one 1–5 star review per listing (with an optional comment); sellers cannot review their own listings. Reviews are available at `GET /api/listings/{id}/reviews` and are submitted to the same endpoint with `POST`.

Marketplace search is available at `GET /api/listings/search` with optional `q`, `category`, `minPrice`, `maxPrice`, `listingType`, `sort`, `page`, and `size` parameters. `sort` accepts `newest`, `price_asc`, or `price_desc`; page numbering starts at zero and page size is limited to 50. The original `GET /api/listings` response remains available for clients that need the full available-listing collection.

Students can also publish and discover tutoring, design/technology, repair, and other services at `/services`. Service listings use `listingType=SERVICE` in the marketplace API, can be searched and filtered by category, and may be free or priced. Use `/services/new` to publish a service; interested students can contact providers through listing messages.

The `/local-deals` directory displays current promotions from nearby businesses, including offer terms, promo codes, location, redemption URL, and expiry date. Authenticated students can share deals using `POST /api/local-deals`; `GET /api/local-deals` is public and omits expired deals. Contributors should only share offers they are authorized to post.

Hostel clearance has a dedicated `/hostel-clearance` directory backed by available listings marked `hostelClearance=true`. Sellers can create one from `/hostel-clearance/new` or mark an existing item in the listing form. Search supports `GET /api/listings/search?hostelClearanceOnly=true`; these listings continue to use normal marketplace ownership, messaging, availability, and verification rules.

The authenticated `/wishlist` page stores saved listing references in the database, scoped to the signed-in account. Use `GET /api/wishlist`, `POST /api/wishlist/{listingId}`, `DELETE /api/wishlist/{listingId}`, and `GET /api/wishlist/check/{listingId}`. The browser reloads wishlist data after authentication; Redux state is transient and cleared when the account logs out or changes. Sold or removed listings remain visible in the wishlist as unavailable until removed by the user.

## Messages and notifications
Authenticated users can start a conversation from an available listing. Conversation messages and notifications are persisted in the configured database; only the buyer and seller can view or send messages in that conversation. Verification reviews, moderation status changes, and report updates also create notifications for affected users. Use `/messages` for the inbox and `/notifications` for paginated notification history.

The authenticated notification APIs are `GET /api/notifications?page=0&size=20`, `GET /api/notifications/unread-count`, `PATCH /api/notifications/{id}/read`, `PATCH /api/notifications/read-all`, and `DELETE /api/notifications/{id}`. The navigation bell receives new notifications over an authenticated server-sent event stream at `GET /api/notifications/stream`; REST refresh remains the fallback. Notification ownership always comes from the JWT principal. Hibernate `ddl-auto: update` adds the notification title, related entity reference, event key, and indexes; no separate migration framework is configured.

## Administration
Only accounts with the backend `ADMIN` role can use `/admin` or `/api/admin/**`. Administrators can review student verification requests, suspend/reinstate accounts, remove or restore listings, review user-submitted listing reports, and inspect aggregate marketplace counts. Suspended accounts are rejected on subsequent JWT-authenticated requests; reinstatement does not issue a new token. Regular student registration cannot assign the admin role. Configure the admin credentials through `ADMIN_EMAIL` and `ADMIN_PASSWORD`; the built-in demo admin credentials are for local development only.

Signed-in users can submit listing reports from the listing detail page. Reports are private to admins and are not returned by public listing APIs.

## Campus board
Open `/campus-board` while signed in to browse Lost, Found, and announcement posts for your account's university. Signed-in users can create posts, mark their own posts resolved, and remove their own posts. Board responses omit email addresses, phone numbers, and student IDs; posters should not include private contact information in post text.

Set `JWT_SECRET` in the backend environment to a private value containing at least 32 UTF-8 bytes. Keep the same value across restarts so issued tokens remain valid. If omitted, the backend logs a warning and creates a temporary random secret; tokens will be invalidated on restart. Never commit the secret or place it in frontend configuration.

## Run the frontend
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173.

## Tests
`cd backend && mvn test` (uses in-memory H2) · `cd frontend && npm test`

## Environment variables
See `.env.example`. Spring reads real environment variables (not `.env` files).

## Demo admin (local development only)
`admin@campusbazaar.demo` / `ChangeMe@123` (override with `ADMIN_EMAIL` / `ADMIN_PASSWORD`). Never use this in production.

## Structure
```
backend/src/main/java/com/campusbazaar/{config,controller,service,repository,entity,dto,mapper,security,exception,validation,util}
frontend/src/{components,pages,redux,services,hooks,utils,assets}
```

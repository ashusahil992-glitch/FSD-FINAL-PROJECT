# CampusBazaar — Buy. Sell. Save. Connect.

Verified student marketplace and campus community platform.
**Status: Phase 1 (foundation) complete.** Later phases add auth, marketplace, chat, deals, admin, etc.

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
mvn spring-boot:run
```
The database `campusbazaar` is created automatically. Check http://localhost:8080/api/health.

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

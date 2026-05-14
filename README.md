
# Allocore (AdminOS)

Role-based resource administration platform with a Spring Boot (Java) backend and a React (Create React App) frontend.

## Repo layout

- `backend/` — Spring Boot API (Java 21, Maven, Spring Security + JWT, Spring Data JPA)
- `frontend/` — React UI (CRA / `react-scripts`)

## Prerequisites

- **Node.js** (LTS recommended) + npm
- **Java 21**
- **PostgreSQL** (local dev)

## Environment variables

### Backend

Set these before starting the backend:

- `JWT_SECRET` — required; used to sign/verify JWTs (use a long random string; 32+ chars recommended)
- `DB_URL` — optional; default `jdbc:postgresql://localhost:5432/allocore`
- `DB_USERNAME` — optional; default `postgres`
- `DB_PASSWORD` — optional; default empty
- `JPA_DDL_AUTO` — optional; default `validate`

On Windows (PowerShell):

- `setx JWT_SECRET "your-long-random-secret"`
- `setx DB_PASSWORD "your-postgres-password"`

Restart your terminal after `setx`.

### Frontend

No env vars are currently used. The UI calls the API at `http://localhost:8080` (hardcoded in the components).

## Quick start (local)

### 1) Start PostgreSQL

Create a database named `allocore` and ensure the schema exists.

Important: the backend is configured with `spring.jpa.hibernate.ddl-auto=validate` by default, so it expects tables to already be present.

### 2) Start the backend (port 8080)

From `backend/`:

- `./mvnw spring-boot:run` (macOS/Linux)
- `mvnw.cmd spring-boot:run` (Windows)

Health check:

- `GET http://localhost:8080/test/ping` → `Server working`

### 3) Start the frontend (port 3000)

From `frontend/`:

- `npm install`
- `npm start`

Open:

- `http://localhost:3000`

## API (what the frontend calls)

Base URL: `http://localhost:8080`

Auth:

- `POST /auth/register` — registers a user
- `POST /auth/login` — returns `{ token }`

Resources:

- `GET /resources/all`
- `POST /resources/create`
- `GET /resources/pending`
- `PUT /resources/request/{id}`
- `PUT /resources/approve/{id}`
- `PUT /resources/complete/{id}`
- `GET /resources/assigned?email=...`

Users / org:

- `GET /users/org`
- `PUT /users/remove/{id}`
- `PUT /users/update-role/{id}?role=...`
- `GET /organizations/invite-code`

Admin:

- `GET /admin/stats`

JWT expectations (frontend):

- `sub` = email
- `role` = `ORG_ADMIN` | `STAFF` | `USER`
- `exp` = expiration (seconds since epoch)

## Known gaps (current state)

- Frontend calls `PUT /resources/reject/{id}`, but the backend does not currently implement that endpoint.
- `GET /resources/assigned` currently returns an empty list (`ResourceService` is a stub).
- Several UI fields (like `requestedBy`) are not present in the current backend `ResourcesTable` entity.

## Building

Frontend:

- `cd frontend && npm run build`

Backend:

- `cd backend && ./mvnw -DskipTests package` (macOS/Linux)
- `cd backend && mvnw.cmd -DskipTests package` (Windows)

## Notes for Git push

- Ensure `node_modules/`, `frontend/build/`, and `backend/target/` are not committed (they are ignored by `.gitignore`).
- This repo currently contains a nested Git repository inside `frontend/`. If you want a single repo (monorepo), remove `frontend/.git` or convert it to a proper submodule intentionally.

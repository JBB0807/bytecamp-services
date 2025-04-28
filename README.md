## Running the Project with Docker

This project consists of four services, each with its own Dockerfile and environment configuration. All services are orchestrated using Docker Compose for local development and testing.

### Project-Specific Requirements
- **Node.js Version:** All services use Node.js `22.13.1-slim` (set via `ARG NODE_VERSION=22.13.1` in Dockerfiles).
- **System Dependencies:**
  - `openssl` is installed in the database services for Prisma and bcrypt support.
- **Non-root Users:** All containers run as non-root users for improved security.

### Environment Variables
- Each service requires its own `.env` file, referenced in the `docker-compose.yml` via the `env_file` directive:
  - `./assignment-db-service/.env`
  - `./assignment-service/.env`
  - `./auth-service/.env`
  - `./user-db-service/.env`
- Ensure these files are present and populated with the required variables before starting the services.

### Build and Run Instructions
1. **Clone the repository and ensure all subdirectories and `.env` files are present.**
2. **Build and start all services:**
   ```sh
   docker compose up --build
   ```
   This will build all images and start the containers as defined in `docker-compose.yml`.

### Service Ports
- **assignment-db-service:**
  - Exposes port **3000** (host: 3000 → container: 3000)
- **assignment-service:**
  - Exposes port **8080** (host: 8080 → container: 8080)
- **auth-service:**
  - Exposes port **8081** (host: 8081 → container: 8080)
- **user-db-service:**
  - Exposes port **3001** (host: 3001 → container: 3000)

### Special Configuration
- All services are connected to a shared Docker network named `backend` for internal communication.
- The `assignment-service` depends on `assignment-db-service` and will wait for it to be available before starting.
- Prisma client is generated during the build process for database services.

---

*Ensure you have Docker and Docker Compose installed on your system before proceeding.*
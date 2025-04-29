# Running the Project with Docker

This section provides instructions to build and run the project using Docker.

## Prerequisites

- Ensure Docker and Docker Compose are installed on your system.
- The project requires Node.js version `22.13.1` as specified in the Dockerfile.

## Environment Variables

- If applicable, create a `.env` file in the project root directory to define environment variables. Uncomment the `env_file` line in the `docker-compose.yml` file to enable this.

## Build and Run Instructions

1. Build the Docker image and start the services:

   ```bash
   docker-compose up --build
   ```

2. Access the application at `http://localhost:8080`.

## Configuration

- The application runs with a non-root user for enhanced security.
- The `NODE_ENV` is set to `production` and `NODE_OPTIONS` is configured for optimized memory usage.

## Exposed Ports

- The application service exposes port `8080` to the host system.

For further details, refer to the provided `Dockerfile` and `docker-compose.yml` files.
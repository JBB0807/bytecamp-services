# syntax=docker/dockerfile:1

# Use the official Node.js image as the base image
ARG NODE_VERSION=22.13.1
FROM node:${NODE_VERSION}-slim AS base

# Set the working directory
WORKDIR /app

# Install curl, ping, and netstat
RUN apt-get update && apt-get install -y curl iputils-ping net-tools

COPY . .
RUN npm install

# Install dependencies using npm ci for deterministic builds
# RUN --mount=type=cache,target=/root/.npm npm ci --production

# Copy the application source code
COPY --link . .

# Expose the application port
EXPOSE 8080

# Define the command to run the application
CMD ["node", "server.js"]
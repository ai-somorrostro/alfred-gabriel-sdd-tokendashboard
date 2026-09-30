# Spec Delta: Docker Deployment

## Purpose
Provides containerization capabilities allowing the AI Model Token Dashboard to be packaged and run consistently across environments using Docker, including documentation on building and running the container.

## ADDED Requirements

### Requirement: Empaquetado en contenedor Docker
The system SHALL provide a Dockerfile at the repository root based on python:3-alpine that copies project assets, exposes port 8000, and starts Python's built-in HTTP server on port 8000 (python3 -m http.server 8000) in working directory /app.

#### Scenario: Construcción de imagen y arranque de contenedor
- **WHEN** the user executes docker build -t tokendashboard . and runs the container with docker run -d -p 8000:8000 --name tokendashboard tokendashboard
- **THEN** the Docker container starts successfully and serves the static dashboard on http://localhost:8000.

### Requirement: Documentación de despliegue Docker en README
The system SHALL include a dedicated Docker section in README.md detailing the exact commands to build the Docker image, run the container, and open the application in a web browser.

#### Scenario: Consulta de instrucciones de Docker en README
- **WHEN** a developer inspects README.md for execution methods
- **THEN** they find the build command docker build -t tokendashboard ., run command docker run -d -p 8000:8000 --name tokendashboard tokendashboard, and instructions to open http://localhost:8000.

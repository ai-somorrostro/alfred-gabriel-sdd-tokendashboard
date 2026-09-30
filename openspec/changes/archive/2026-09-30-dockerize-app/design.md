# Design: Dockerize Application

## Context

The application is a pure static web dashboard comprised of index.html, styles.css, pp.js, and mock-data.json. Currently, users must host or serve these files manually. See proposal.md for overall motivation.

## Goals / Non-Goals

**Goals:**
- Provide a standardized, reproducible runtime environment using Docker.
- Implement the exact Dockerfile specification outlined in Issue #1 using python:3-alpine and built-in http.server.
- Provide clear, accessible commands in README.md for building and executing the container.

**Non-Goals:**
- Modifying frontend styling, application behavior, or mock dataset.
- Introducing multi-container orchestrations (e.g., Docker Compose) or reverse proxies (e.g., Nginx), keeping the solution strictly aligned with Issue #1 requirements.

## Decisions

### Decision 1: Base image python:3-alpine
- **Choice**: Use official python:3-alpine image.
- **Rationale**: Directly aligns with the requirements of Issue #1. python:3-alpine is lightweight (< 50MB) and includes http.server, which serves static files without additional package installations or complex configurations.
- **Alternatives considered**: 
ginx:alpine or 
ode:alpine with serve. Rejected because the issue specifically dictates Python Alpine.

### Decision 2: Container Directory Structure & Command
- **Choice**: Set WORKDIR /app, copy project files via COPY . ., expose port 8000, and execute CMD [python3, -m, http.server, 8000].
- **Rationale**: Setting /app as the working directory guarantees that index.html is served as the index route / and mock-data.json is served relative to the root, preventing 404s on etch('mock-data.json').

### Decision 3: README Documentation Placement
- **Choice**: Add a standalone ## Docker section in README.md.
- **Rationale**: Keeps execution and containerization instructions clearly identifiable for evaluators and developers without disturbing the existing feature branching or evolutive specifications.

## Risks / Trade-offs

- **[Risk]** Unnecessary files copied into container (e.g. .git or local config).  
  → **Mitigation**: While a standard COPY . . suffices for this lightweight assignment as requested in Issue #1, an optional .dockerignore can exclude .git if desired, or standard files remain safely ignored by the web server.
- **[Risk]** Port 8000 collision on developer machine.  
  → **Mitigation**: Document standard port binding -p 8000:8000 while pointing out that host port can be adjusted (e.g., -p 8080:8000) if port 8000 is already in use.

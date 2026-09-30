# Tasks

## 1. Dockerfile Creation

- [x] 1.1 Create Dockerfile in the repository root based on python:3-alpine, setting WORKDIR /app, COPY . ., EXPOSE 8000, and CMD [python3, -m, http.server, 8000], and verify file structure.

## 2. Documentation Updates

- [x] 2.1 Add a dedicated ## Docker section to README.md documenting image creation (docker build -t tokendashboard .), container execution (docker run -d -p 8000:8000 --name tokendashboard tokendashboard), and browser access (http://localhost:8000), verifying clarity and markdown syntax.

## 3. Verification & Validation

- [x] 3.1 Execute docker build -t tokendashboard . and verify image build completes successfully.
- [x] 3.2 Run container via docker run -d -p 8000:8000 --name tokendashboard tokendashboard and verify http://localhost:8000 serves the dashboard.
- [x] 3.3 Stop and remove test container (docker stop tokendashboard && docker rm tokendashboard) to verify clean lifecycle cleanup.

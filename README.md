# Task Management REST API

## Overview

This project is a production-ready Task Management REST API built using **NestJS**, **Prisma ORM**, and **PostgreSQL (Neon)**.

The application allows authenticated users to manage their own projects and tasks through a secure REST API. It implements authentication, authorization, CRUD operations, filtering, searching, sorting, pagination, soft deletes, automated testing, and Docker support while following clean architecture and NestJS best practices.

---

# Features

* JWT Authentication
* User Registration & Login
* Project CRUD Operations
* Task CRUD Operations
* Pagination
* Filtering
* Sorting
* Case-insensitive Search
* Soft Deletes
* Input Validation using DTOs
* Global Exception Handling
* Swagger API Documentation
* Unit Tests
* Integration (E2E) Tests
* Docker Support
* Database Seed Script

---

# Technology Stack

* NestJS
* TypeScript
* Prisma ORM
* PostgreSQL (Neon)
* JWT Authentication
* Passport.js
* bcrypt
* Swagger
* Docker & Docker Compose
* Jest
* Supertest

---

# Architecture

The application follows a layered architecture.

```text
Client
    │
    ▼
Controllers
    │
    ▼
Services
    │
    ▼
Prisma ORM
    │
    ▼
PostgreSQL (Neon)
```

### Layer Responsibilities

* **Controllers** receive HTTP requests and return responses.
* **Services** contain all business logic.
* **DTOs** validate incoming request data.
* **Prisma ORM** manages database communication.
* **PostgreSQL** stores the application data.

---

# Project Structure

```text
task-management-api
│
├── prisma
│   ├── migrations
│   ├── schema.prisma
│   └── seed.ts
│
├── src
│   ├── auth
│   │   ├── decorators
│   │   ├── dto
│   │   ├── guards
│   │   ├── strategies
│   │   ├── auth.controller.ts
│   │   ├── auth.controller.spec.ts
│   │   ├── auth.service.ts
│   │   ├── auth.service.spec.ts
│   │   └── auth.module.ts
│   │
│   ├── users
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   └── ...
│   │
│   ├── projects
│   │   ├── dto
│   │   ├── entities
│   │   ├── projects.controller.ts
│   │   ├── projects.controller.spec.ts
│   │   ├── projects.service.ts
│   │   ├── projects.service.spec.ts
│   │   └── projects.module.ts
│   │
│   ├── tasks
│   │   ├── dto
│   │   ├── entities
│   │   ├── tasks.controller.ts
│   │   ├── tasks.controller.spec.ts
│   │   ├── tasks.service.ts
│   │   ├── tasks.service.spec.ts
│   │   └── tasks.module.ts
│   │
│   ├── common
│   │   ├── decorators
│   │   ├── filters
│   │   ├── guards
│   │   ├── interfaces
│   │   ├── pipes
│   │   └── utils
│   │
│   ├── prisma
│   │   └── prisma.service.ts
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── test
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── Dockerfile
├── docker-compose.yml
├── entrypoint.sh
├── package.json
└── README.md
```

---

# Database Design

The application consists of three entities:

* User
* Project
* Task

Relationships:

* One User can own many Projects.
* One Project can contain many Tasks.
* Every Task belongs to exactly one Project.

Database design includes:

* UUID primary keys
* Foreign key relationships
* Composite unique constraint `(userId, name)` to prevent duplicate project names for the same user
* Indexed columns for efficient filtering and sorting
* Soft Deletes using `deletedAt`
* Prisma Migrations for schema versioning

An ER Diagram is included with the project.

---

# API Documentation

Swagger documentation is available after starting the application.

```
http://localhost:3000/api/docs
```

---

# Environment Variables

Create a `.env` file using the provided `.env.example`.

Example:

```env
DATABASE_URL=

JWT_SECRET=

JWT_EXPIRES_IN=1d

PORT=3000
```

Do **not** commit your `.env` file or your Neon database credentials.

---

# Installation

Clone the repository.

```bash
git clone <repository-url>

cd task-management-api
```

Install project dependencies.

```bash
npm install
```

---

# Database Migration

Apply the database migrations.

```bash
npx prisma migrate deploy
```

---

# Seed the Database

Populate the database with sample data.

```bash
npx ts-node prisma/seed.ts
```

---

# Running the Application

Start the development server.

```bash
npm run start:dev
```

---

# Running Unit Tests

```bash
npm run test
```

---

# Running Integration (E2E) Tests

Install dotenv-cli if it is not already installed.

```bash
npm install -D dotenv-cli
```

Run the migrations for the test database.

```bash
npx dotenv -e .env.test -- npx prisma migrate deploy
```

Execute the integration tests.

```bash
npx dotenv -e .env.test -- npx jest --config test/jest-e2e.json --runInBand
```

---

# Running with Docker

Build and start all containers.

```bash
docker compose up --build
```

Stop the containers.

```bash
docker compose down
```

The Docker setup automatically:

* Starts the PostgreSQL database
* Starts the NestJS application
* Applies the database migrations before launching the API

---

# Main API Endpoints

## Authentication

| Method | Endpoint             |
| ------ | -------------------- |
| POST   | `/api/auth/register` |
| POST   | `/api/auth/login`    |

## Projects

| Method | Endpoint            |
| ------ | ------------------- |
| POST   | `/api/projects`     |
| GET    | `/api/projects`     |
| GET    | `/api/projects/:id` |
| PUT    | `/api/projects/:id` |
| DELETE | `/api/projects/:id` |

## Tasks

| Method | Endpoint                  |
| ------ | ------------------------- |
| POST   | `/api/projects/:id/tasks` |
| GET    | `/api/projects/:id/tasks` |
| GET    | `/api/tasks`              |
| GET    | `/api/tasks/:id`          |
| PUT    | `/api/tasks/:id`          |
| DELETE | `/api/tasks/:id`          |

Complete request and response examples are available through the Swagger documentation.

---

# Business Rules

* Every user can only access and manage their own projects and tasks.
* Project names must be unique for each user.
* Every task belongs to exactly one project.
* Tasks cannot have a due date in the past.
* Soft deletes are used instead of permanently removing records.
* Deleting a project also soft deletes all associated tasks.
* Task status transitions are allowed in any direction.
* A transition from `DONE` to `TODO` is allowed but logged as an unusual event.
* Soft-deleted records are excluded from normal queries.

---

# Project Design Decisions

* UUIDs are used instead of auto-increment IDs.
* Prisma ORM manages all database operations.
* Prisma Migrations are used for schema management.
* PostgreSQL is hosted on Neon.
* DTO validation is implemented using `class-validator`.
* JWT secures all protected endpoints.
* Authorization checks ensure users only access their own resources.
* Global exception handling provides consistent API responses.
* Case-insensitive search is implemented using Prisma's `contains` operator with `mode: "insensitive"`.
* Database indexes improve filtering and sorting performance.
* Controllers remain thin while business logic is encapsulated within services.

---

# Testing

The project includes both unit and integration tests.

### Unit Tests

Coverage includes:

* Authentication
* Projects
* Tasks
* Controllers
* Services
* Validation
* Business Rules

### Integration Tests

Coverage includes:

* User Authentication
* Project Lifecycle
* Task Lifecycle
* Authorization
* Filtering
* Searching
* Pagination
* Soft Deletes

---

# Future Improvements

Potential future enhancements include:

* Refresh Tokens
* Role-Based Access Control (RBAC)
* Rate Limiting
* Audit Logging
* PostgreSQL Full-Text Search
* Email Verification
* Password Reset
* File Attachments


# Task Management API Blueprint

This workspace is currently in the structure-only phase.

The folders and file names are reserved for the production backend we will build together. Implementation is intentionally left out for now so we can define each module, dependency, and boundary before writing logic.

## Planned Modules

- `auth` for register and login
- `users` for user lookup and identity boundaries
- `projects` for project CRUD and soft delete behavior
- `tasks` for task CRUD, filtering, sorting, searching, and pagination
- `common` for shared decorators, DTOs, enums, filters, interceptors, and validators
- `config` for environment and runtime configuration
- `prisma` for database access infrastructure

## Current State

- Directory structure is in place.
- Source files are placeholders only.
- Prisma schema is intentionally empty for now.

## Next Step

We can now fill in one module at a time, starting with the architecture contracts and data model.
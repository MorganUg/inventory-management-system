# Sweet Inventory Management System (IMS)

## Project Title

Inventory Management System (IMS)

## Overview

This repository contains a full-stack inventory management application for sweet manufacturing operations. It includes:

- A React frontend built with Vite
- An Express.js backend API
- PostgreSQL database schema and migrations
- Inventory management for raw materials, finished goods, production batches, restocks, dispatches, and stock movements
- Role-based authentication and authorization
- AI-powered inventory and demand forecasting features

## Repository Structure

- `frontend/` - React application for the user interface
- `Server/` - Node.js / Express backend API
- `migrations/` - SQL migration files and database schema definitions
- `Information/` - project documentation and architecture notes

## Key Features

- User authentication and role-based access control
- Raw material inventory tracking
- Bill of Materials (BOM) and production batch processing
- Finished goods management and dispatch workflows
- Supplier, customer, and category management
- Stock movement and reporting dashboards
- AI insights for demand forecasting and inventory recommendations

## Frontend

The frontend is located in `frontend/` and uses:

- React
- Vite
- Tailwind CSS
- React Router
- React Query
- Axios

### Run Frontend

```bash
cd frontend
npm install
npm run dev
```

## Backend

The backend is located in `Server/` and uses:

- Node.js
- Express
- PostgreSQL
- JWT authentication
- Helmet, CORS, rate limiting for security

### Run Backend

```bash
cd Server
npm install
npm run dev
```

## Database Setup

The repository includes SQL scripts for schema and migrations. Use PostgreSQL to create the database and apply the schema.

### Create the PostgreSQL database

Run one of the following commands in a terminal where PostgreSQL is installed.

Using `psql`:

```bash
psql -U <username> -d postgres -c "CREATE DATABASE sweet_inventory;"
```

Or using `createdb`:

```bash
createdb -U <username> sweet_inventory
```

### Apply the schema

```bash
psql -U <username> -d sweet_inventory -f migrations/database.sql
```

### Seed the database

If the backend includes a seed script, run:

```bash
cd Server
npm run seed
```

If you prefer to run the seeder directly, use:

```bash
cd Server
node src/db/seed.js
```

## Environment Variables

Create a `.env` file in `Server/` with values similar to:

```env
PORT=5000
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/sweet_inventory
JWT_SECRET=<your-jwt-secret>
EMAIL_HOST=<smtp-host>
EMAIL_PORT=<smtp-port>
EMAIL_USER=<smtp-user>
EMAIL_PASS=<smtp-password>
```

### Local development database connection

For local development, point `DATABASE_URL` to your local PostgreSQL instance and database name. Example:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/sweet_inventory
```

Ensure your local PostgreSQL server is running before starting the backend. The backend will use this connection string to access the local database during development.

## Default Admin Credentials

When using the development seed data, the default admin account is:

```text
Username: admin
Email: admin@candykingdom.com
Password: DevAdmin!2026#Secure
```

> These are development-only credentials. Change the password immediately and do not use them in production.

## Notes

- The system includes documentation in `Information/` and `Server/AI_User_Guide.md`.
- The backend package scripts support development and seeding.
- The frontend package scripts support development, build, lint, and preview.

## License

This repository does not specify a license. Add one as needed for your project.

# OAS Docker Deployment Guide

## Overview
This deployment setup uses separate services:
- **Database Service**: Standalone MySQL service in `/database/`
- **Frontend Service**: Next.js full-stack application with API routes

## Quick Start

### 1. Create Docker Network
```bash
# Create shared network for all services
docker network create oas-network
```

### 2. Start Database Service
```bash
cd database/
docker-compose up -d
```

### 3. Start Frontend Application

**Option A: Development (recommended)**
```bash
cd frontend/
npm run dev
```

**Option B: Production Docker**
```bash
cd frontend/
docker-compose up -d --build
```

## Services Overview

| Service | Location | Port | Description |
|---------|----------|------|-------------|
| MySQL Database | `/database/` | 3306 | Standalone database service |
| Next.js Frontend | `/frontend/` | 3000 | Full-stack web application |
| Redis (optional) | Development only | 6379 | Caching/sessions |

## Architecture

```
┌─────────────────────────────┐    ┌─────────────────┐
│      Next.js Frontend       │    │     MySQL       │
│   ┌─────────────────────┐   │    │   (Database)    │
│   │   React Components  │   │    │   Port: 3306    │
│   └─────────────────────┘   │    │                 │
│   ┌─────────────────────┐   │◄───┤  Separate       │
│   │    API Routes       │   │    │  Service        │
│   │   (/api/*)          │   │    │                 │
│   └─────────────────────┘   │    │                 │
│      Port: 3000             │    │                 │
└─────────────────────────────┘    └─────────────────┘
         │                                   │
         └─────────── oas-network ───────────┘
```

## Deployment Scenarios

### Scenario 1: Development (Recommended)
```bash
# 1. Create network
docker network create oas-network

# 2. Start database
cd database/ && docker-compose up -d

# 3. Start frontend locally
cd ../frontend/ && npm run dev

# Access at http://localhost:3000
```

### Scenario 2: Full Production Docker
```bash
# 1. Create network
docker network create oas-network

# 2. Start database
cd database/ && docker-compose up -d

# 3. Start frontend in Docker
cd ../frontend/ && docker-compose up -d --build

# Access at http://localhost:3000
```

### Scenario 3: Hybrid (Database local, Frontend Docker)
```bash
# 1. Start database locally or in Docker
cd database/ && docker-compose up -d

# 2. Update frontend .env.local with localhost
# DB_HOST=localhost

# 3. Start frontend in Docker
cd ../frontend/ && docker-compose up -d --build
```

## Environment Configuration

### Database Service
Database connection details (see `/database/README.md`):
```bash
DB_HOST=localhost      # or 'mysql' when connecting from containers
DB_PORT=3306
DB_NAME=oas_database
DB_USER=oas_user
DB_PASSWORD=oaspassword
```

### Frontend Service
Environment variables for the frontend:

**Local Development (`frontend/.env.local`)**:
```bash
# Database connection
DB_HOST=localhost
DB_PORT=3306
DB_NAME=oas_database
DB_USER=oas_user
DB_PASSWORD=oaspassword

# API configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
NEXT_PUBLIC_USE_MOCK_API=false

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**Docker Production** (set in docker-compose.yml):
```yaml
environment:
  - DB_HOST=mysql    # Uses Docker service name
  - DB_PORT=3306
  - DB_NAME=oas_database
  - DB_USER=oas_user
  - DB_PASSWORD=oaspassword
```

## Database Initialization

The database service automatically initializes with:
1. Complete OAS schema (users, courses, assignments, etc.)
2. Test data with sample accounts
3. Proper indexes and foreign key constraints

Test accounts available:
| Email | Password | Role |
|-------|----------|------|
| `superadmin@example.com` | `password123` | Super Admin |
| `admin@example.com` | `password123` | Course Admin |
| `examiner@example.com` | `password123` | Examiner |
| `student@example.com` | `password123` | Student |

## Management Commands

### Database Management
```bash
cd database/

# Start/stop database
docker-compose up -d
docker-compose down

# Connect to database
docker exec -it oas-mysql mysql -u oas_user -p oas_database

# View logs
docker-compose logs -f mysql

# Backup/restore
docker exec oas-mysql mysqldump -u oas_user -p oas_database > backup.sql
docker exec -i oas-mysql mysql -u oas_user -p oas_database < backup.sql
```

### Frontend Management
```bash
cd frontend/

# Development
npm run dev

# Production Docker
docker-compose up -d --build
docker-compose logs -f frontend
docker-compose restart frontend

# Clean rebuild
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

### Network Management
```bash
# Create shared network
docker network create oas-network

# List networks
docker network ls

# Inspect network
docker network inspect oas-network

# Remove network (stop all services first)
docker network rm oas-network
```

## Complete Setup Steps

### First Time Setup
```bash
# 1. Create the shared network
docker network create oas-network

# 2. Start database service
cd database/
docker-compose up -d

# 3. Wait for database to be ready (check logs)
docker-compose logs -f mysql

# 4. Start frontend (choose one)
cd ../frontend/

# Option A: Development
npm install
npm run dev

# Option B: Production Docker
docker-compose up -d --build

# 5. Access application
# http://localhost:3000
```

### Daily Development
```bash
# Start database (if not running)
cd database/ && docker-compose up -d

# Start frontend development
cd frontend/ && npm run dev
```

### Production Deployment
```bash
# Create network
docker network create oas-network

# Start all services
cd database/ && docker-compose up -d
cd ../frontend/ && docker-compose up -d --build

# Monitor
docker ps
docker-compose logs -f
```

## Troubleshooting

### Network Issues
```bash
# Check if network exists
docker network ls | grep oas-network

# Create network if missing
docker network create oas-network

# Check services are connected to network
docker network inspect oas-network
```

### Database Connection Issues
```bash
# Check database is running
cd database/ && docker-compose ps

# Test connection
docker exec -it oas-mysql mysql -u oas_user -p

# Check frontend can reach database
cd frontend/
curl http://localhost:3000/api/init
```

### Frontend Issues
```bash
# Check frontend logs
cd frontend/
docker-compose logs frontend

# Rebuild frontend
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

### Reset Everything
```bash
# Stop all services
cd database/ && docker-compose down -v
cd ../frontend/ && docker-compose down

# Remove network
docker network rm oas-network

# Start fresh
docker network create oas-network
cd database/ && docker-compose up -d
cd ../frontend/ && npm run dev
```

## File Structure

```
project-root/
├── database/                   # Database service
│   ├── docker-compose.yml    # Database configuration
│   ├── init/                  # SQL initialization scripts
│   └── README.md             # Database documentation
├── frontend/                  # Frontend application
│   ├── docker-compose.yml    # Frontend Docker config
│   ├── Dockerfile            # Frontend container
│   ├── app/                  # Next.js application
│   └── .env.local            # Local environment variables
├── docker-compose.yml        # Main production compose (frontend only)
├── docker-compose.dev.yml    # Development tools
└── DOCKER-DEPLOYMENT.md      # This file
```

This separation allows:
- **Independent scaling** of database and frontend
- **Easier development** with local frontend + Docker database
- **Flexible deployment** options for different environments
- **Clear separation of concerns** between services
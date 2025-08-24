# OAS Database Service

This directory contains the MySQL database service for the Oral Assessment System (OAS).

## Quick Start

### Start Database Service
```bash
cd database/
docker-compose up -d
```

### Stop Database Service
```bash
cd database/
docker-compose down
```

## Configuration

### Database Connection Details
- **Host**: localhost
- **Port**: 3306
- **Database**: oas_database
- **Username**: oas_user
- **Password**: oaspassword
- **Root Password**: rootpassword

### Network
The database service creates an external network `oas-network` that other services can connect to.

## Database Schema

The database is automatically initialized with:

### Core Tables
- `users` - System users (students, examiners, admins)
- `user_sessions` - JWT session management
- `courses` - Course information
- `assignments` - Assignment/assessment definitions
- `groups` - Student groups for group assignments
- `group_members` - Group membership

### Assessment Tables
- `time_slots` - Available booking time slots
- `bookings` - Student/group bookings
- `rubrics` - Assessment rubrics
- `rubric_criteria` - Rubric criteria and scoring
- `assessments` - Assessment records
- `assessment_scores` - Individual criteria scores

### Utility Tables
- `comment_templates` - Reusable feedback templates
- `system_logs` - System activity logs

## Test Data

The database includes test accounts:

| Email | Password | Role |
|-------|----------|------|
| `superadmin@example.com` | `password123` | Super Admin |
| `admin@example.com` | `password123` | Course Admin |
| `examiner@example.com` | `password123` | Examiner |
| `examiner2@example.com` | `password123` | Examiner |
| `student@example.com` | `password123` | Student |
| `student2@example.com` | `password123` | Student |

## Management Commands

### Connect to MySQL
```bash
# Using Docker
docker exec -it oas-mysql mysql -u oas_user -p oas_database

# Using local MySQL client
mysql -h localhost -P 3306 -u oas_user -p oas_database
```

### Backup Database
```bash
docker exec oas-mysql mysqldump -u oas_user -p oas_database > backup.sql
```

### Restore Database
```bash
docker exec -i oas-mysql mysql -u oas_user -p oas_database < backup.sql
```

### View Logs
```bash
docker-compose logs -f mysql
```

### Reset Database
```bash
# WARNING: This will delete all data
docker-compose down -v
docker-compose up -d
```

## Directory Structure

```
database/
├── docker-compose.yml          # Database service configuration
├── init/                       # Database initialization scripts
│   ├── 01-init-schema.sql     # Database schema
│   └── 02-seed-data.sql       # Test data
└── README.md                  # This file
```

## Integration with Frontend

The frontend application should connect using these environment variables:

```bash
DB_HOST=localhost
DB_PORT=3306
DB_NAME=oas_database
DB_USER=oas_user
DB_PASSWORD=oaspassword
```

## Network Configuration

The database service creates an external Docker network `oas-network`. Other services can connect by:

1. **Joining the network**:
   ```yaml
   services:
     your-app:
       networks:
         - oas-network
   
   networks:
     oas-network:
       external: true
   ```

2. **Using the service name as hostname**:
   ```bash
   DB_HOST=mysql  # Instead of localhost when connecting from other containers
   ```

## Troubleshooting

### Connection Refused
```bash
# Check if container is running
docker ps | grep oas-mysql

# Check logs
docker-compose logs mysql

# Restart service
docker-compose restart mysql
```

### Authentication Issues
The MySQL service is configured with `mysql_native_password` plugin for compatibility with Node.js applications.

### Data Persistence
Database data is stored in the `mysql_data` Docker volume. To completely reset:
```bash
docker-compose down -v  # WARNING: Deletes all data
docker volume ls | grep mysql
docker volume rm database_mysql_data
```
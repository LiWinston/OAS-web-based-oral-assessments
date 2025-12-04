# OAS Deployment, Migration, and Operations Guide

## Purpose and Audience
- Documents how to move and operate the OAS platform in a future hosting environment (cloud-first, not tied to a personal computer).
- Targets infrastructure/IT staff and future developers who will maintain and extend the system.
- Complements the existing `Docs/Deployment Guide.md` (local workstation) by focusing on production-grade migration, hosting choices, and runbooks.

## System Snapshot
- **Frontend:** Next.js 15 (React 19), served via `npm run start` after `npm run build`; environment keys live in `frontend/.env.local`.
- **Backend:** Spring Boot 2.7 with MyBatis-Plus, JWT auth, Redis token cache, SMTP password reset; packaged as `backend/target/OAS-0.0.1-SNAPSHOT.jar` and containerised via `backend/Dockerfile`.
- **Data:** MySQL 8.0 schema (`backend/src/main/resources/db/DDL.sql`, seeded users in `test_data.sql`), optional Redis (`REDIS_URL`), CSV storage path (`CSV_STORAGE_PATH`), and SMTP provider (`MAIL_USERNAME` / `MAIL_PASSWORD`).
- **Security:** JWT secret (`JWT_SECRET`), CORS allowlist, email domain validation toggle, and role-based dashboards (Student, Examiner, Course Admin, Super Admin).

## Reference Hosting Target (AWS)
Chosen target is AWS using managed services to reduce operational lift and align with university cloud patterns:
- **Network:** One VPC with public subnets for load balancers and private subnets for ECS tasks, RDS, and ElastiCache.
- **Compute:** AWS ECS Fargate for **two services** (frontend service on port 3000, backend service on port 8081). This keeps SSR-capable Next.js intact.
- **Data:** Amazon RDS for MySQL 8.0 (multi-AZ optional), Amazon ElastiCache for Redis (optional but recommended for token cache).
- **Routing:** Application Load Balancer (ALB) with host/path rules (e.g., `app.example.edu` → frontend target group, `api.example.edu` → backend target group) and ACM TLS certificates.
- **Email:** Amazon SES in a verified domain, or any SMTP provider plugged into `MAIL_*` env vars.
- **Secrets/Config:** AWS Secrets Manager (secrets) + SSM Parameter Store (non-secret config).
- **Edge/Static Assets:** CloudFront in front of the ALB for caching and TLS offload (optional), S3 for artifacts/log archives/backups.

## Migration Guide (to AWS Fargate + RDS)
1. **Pre-migration checklist**
   - Domain names reserved (e.g., `app.example.edu`, `api.example.edu`) and access to DNS registrar.
   - AWS account with IAM roles for networking, ECS, RDS, ECR, ACM, SES, and Secrets Manager.
   - Export of current MySQL data: `mysqldump -h <source> -u <user> -p swen90017_db > oas.sql` (rotate credentials after export).
   - Inventory of required environment variables (see “Operations Runbook” below).

2. **Bootstrap networking**
   - Create VPC with at least 2 public and 2 private subnets across AZs.
   - Security groups: ALB (80/443 inbound), backend tasks (8081 from ALB SG), frontend tasks (3000 from ALB SG), RDS (3306 from backend SG), Redis (6379 from backend SG).

3. **Provision data layer**
   - Create RDS MySQL 8.0 instance (db.t3.medium or higher for production; enable backups and performance insights).
   - Create a database `swen90017_db` and users for app + read-only ops.
   - Import schema and data:
     - `mysql -h <rds-endpoint> -u <user> -p swen90017_db < backend/src/main/resources/db/DDL.sql`
     - `mysql -h <rds-endpoint> -u <user> -p swen90017_db < backend/src/main/resources/db/test_data.sql` (optional seed users)
   - (Optional) Provision ElastiCache Redis; capture its rediss URL for `REDIS_URL`.

4. **Email provider**
   - If using SES: verify domain, create SMTP credentials, and move out of sandbox for production sending.
   - Update `MAIL_USERNAME` / `MAIL_PASSWORD` and ensure `MAIL_HOST`/`MAIL_PORT` defaults align with SES or chosen SMTP.

5. **Build and publish artifacts**
   - Backend: `./mvnw clean package -DskipTests` → `target/OAS-0.0.1-SNAPSHOT.jar`; build image `docker build -t <ecr>/oas-backend:latest backend`.
   - Frontend: `npm ci && npm run build` in `frontend`; build image `docker build -t <ecr>/oas-frontend:latest frontend` (ensure `.env.production`/`.env.local` baked as runtime env, not in image).
   - Push both images to dedicated ECR repositories.

6. **ECS Fargate deployment**
   - Create task definitions:
     - **Backend task:** image `<ecr>/oas-backend:latest`, port 8081, CPU 512–1024, memory 1–2 GB. Set env vars: `DB_USERNAME`, `DB_PASSWORD`, JDBC URL pointing to RDS, `JWT_SECRET`, `MAIL_*`, `REDIS_URL`, `CSV_STORAGE_PATH`, `CORS_ALLOWED_ORIGINS`, `EMAIL_DOMAIN_VALIDATION_ENABLED`, `CSV_IMPORT_USE_EMAIL_COLUMN`.
     - **Frontend task:** image `<ecr>/oas-frontend:latest`, port 3000, CPU 512, memory 1 GB. Env vars: `NEXT_PUBLIC_API_BASE_URL=https://api.example.edu`, `NEXT_PUBLIC_USE_MOCK_API=false`, `NEXT_PUBLIC_BYPASS_AUTH=false`.
   - Create services with desired count >=2 for HA (or 1 for pilot), using private subnets and the ALB target groups.
   - Attach ALB listeners: route `/api/*` or host `api.*` to backend TG; default/`app.*` to frontend TG.

7. **TLS, DNS, and caching**
   - Issue ACM certificates for `app.example.edu` and `api.example.edu`; attach to ALB 443 listener.
   - Create DNS A/AAAA records pointing to the ALB.
   - (Optional) Put CloudFront in front of `app.example.edu` for global caching; origin is the ALB frontend listener.

8. **Data migration cutover**
   - Freeze writes on the source, take final `mysqldump`, restore to RDS, and rotate DB passwords.
   - Update ECS task definitions with the new credentials and redeploy.
   - Smoke tests: `/swagger-ui/index.html` (backend), login with seeded users, book a session, submit/refresh tokens.

9. **CI/CD (optional but recommended)**
   - GitHub Actions pipeline: on main merges, build/push images to ECR and update ECS services via `aws ecs update-service --force-new-deployment`.
   - Add pull request checks: `npm run lint`, `./mvnw test`.

10. **Rollback plan**
    - Keep the previous task definition revisions; `aws ecs update-service --task-definition <previous>` if a deploy fails.
    - Restore last known-good RDS snapshot if schema/data migration breaks (note RPO/RTO in Ops runbook).

## Infrastructure Requirements and Decision Points
- **Sizing (starter vs production):**
  - Backend Fargate: 0.5 vCPU/1 GB (pilot), 1 vCPU/2–4 GB (production).
  - Frontend Fargate: 0.5 vCPU/1 GB (pilot), 1 vCPU/2 GB (production) if SSR; static hosting via CloudFront/S3 is viable if no server-side features are added.
  - RDS MySQL: db.t3.medium with 50–100 GB gp3, multi-AZ optional; enable backups (7–30 days).
  - ElastiCache Redis: cache.t3.micro (pilot) scaling to cache.t3.small/medium.
- **Managed vs self-hosted:**
  - Prefer managed RDS/ElastiCache/SES to avoid patching/ops overhead; only self-host if constrained by policy.
- **Environment strategy:** Maintain at least `dev` and `prod` with separate RDS/Redis instances and ALB listeners; consider `staging` for UAT.
- **Secrets management:** Use Secrets Manager for `DB_*`, `JWT_SECRET`, `MAIL_*`; Parameter Store for non-secrets like `CORS_ALLOWED_ORIGINS`.
- **Email choice:** SES (recommended) vs institution SMTP; ensure SPF/DKIM alignment for deliverability.
- **Redis choice:** Required for token blacklisting; if omitted, fall back to stateless tokens but revoke/refresh flows will degrade.
- **Storage paths:** `CSV_STORAGE_PATH` should point to an attached EFS mount or S3-backed path if CSV import/export volume grows.
- **Future development:** If adding file uploads, video, or analytics, plan for S3 buckets and IAM roles; if adding SSO, reserve an IdP (e.g., Azure AD via OIDC/SAML).

## Operations Runbook
- **Configuration keys (must exist in runtime env)**
  - Backend (`application.yml` reads these): `DB_USERNAME`, `DB_PASSWORD`, JDBC URL, `JWT_SECRET`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `EMAIL_DOMAIN_VALIDATION_ENABLED`, `CSV_STORAGE_PATH`, `CSV_IMPORT_USE_EMAIL_COLUMN`, `REDIS_URL`, `CORS_ALLOWED_ORIGINS`, `CORS_ALLOWED_METHODS`, `CORS_ALLOWED_HEADERS`.
  - Frontend: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_USE_MOCK_API`, `NEXT_PUBLIC_BYPASS_AUTH`, `NEXT_PUBLIC_ENABLE_GLOBAL_SEARCH` (optional).
- **Start/stop & deploy**
  - ECS: update service to force new deployment; scale desired count to 0 for maintenance, then back up.
  - Backend standalone (fallback): `java -jar OAS-0.0.1-SNAPSHOT.jar --server.port=8081` with env vars exported.
- **Health checks and smoke tests**
  - Backend: ALB target health, `/swagger-ui/index.html`, login/refresh token flow, sample booking.
  - Frontend: Landing page load, role-based dashboard access, API calls succeeding (check network tab).
- **Logging and monitoring**
  - Backend logs: CloudWatch log group from ECS or file `backend/logs/oas-application.log` if running on VM.
  - Set CloudWatch alarms on 5xx rates (backend TG), task restarts, RDS CPU/conn count, Redis eviction.
- **Backups and recovery**
  - RDS automated snapshots + manual pre-release snapshots; document RPO/RTO (e.g., 24h RPO, 4h RTO).
  - Export CSV data to S3 periodically if regulators require audit trails.
  - Redis: treated as cache; persistence optional.
- **Access and credentials**
  - Rotate `JWT_SECRET`, DB, SMTP credentials quarterly or on incident; redeploy tasks after rotation.
  - IAM: least-privilege roles for CI/CD, ops, and read-only reporting.
- **User and data administration**
  - Seed users (optional) from `backend/src/main/resources/db/test_data.sql` for smoke testing.
  - Use Course Admin interface to manage real users; avoid editing DB directly except for emergency fixes.
- **Change management**
  - PR checks: `npm run lint`, `./mvnw test`.
  - Versioned releases: tag Git commits; store built images with immutable tags (`vX.Y.Z`).
  - Rollback: revert ECS to previous task definition; restore DB snapshot if schema migrations were applied.
- **Security and compliance**
  - Enforce TLS at ALB; restrict backend SG to ALB only.
  - Enable CORS allowlist to the official frontend domains.
  - Keep JWT expiry defaults (15 min access, 7 day refresh) unless policy requires change.
  - Avoid storing production secrets in repo or Docker images; rely on runtime injection.

## If Hosting Elsewhere
- **Render/Fly.io/Heroku equivalents:** Use managed Postgres/MySQL and Redis add-ons, bind env vars per above, and deploy backend as a container; frontend can be hosted on Vercel/Netlify with `NEXT_PUBLIC_API_BASE_URL` pointing to the backend.
- **On-prem VM:** Follow the same env var set; run backend jar + Nginx reverse proxy + MySQL 8 + Redis. Ensure firewalls limit DB/Redis to the app host and rotate secrets manually.

## Handover Expectations
- Deployment artifacts (built images or jar) plus this guide enable a new team to stand up the stack without local-only shortcuts.
- The system remains production-aligned: no reduced feature set, seeded roles consistent with backend auth, and infra decisions documented for future extensibility.

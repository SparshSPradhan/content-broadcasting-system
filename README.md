# 📡 Content Broadcasting System

A production-ready backend for broadcasting educational content from teachers to students, built with **Node.js + Express + PostgreSQL + Prisma + Redis**.

---


## 🌐 Live Demo

* 🚀 **Live API:**
  https://content-broadcasting-system-njdf.onrender.com

* 📄 **API Documentation (Swagger):**
  https://content-broadcasting-system-njdf.onrender.com/api/docs

> ⚠️ Note: Swagger docs are enabled via environment flag (`ENABLE_DOCS=true`) for evaluation purposes.


## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 + TypeScript |
| Framework | Express.js |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Auth | JWT + bcrypt |
| Validation | Zod |
| File Upload | Multer (local) + AWS S3 (optional) |
| Docs | Swagger / OpenAPI 3 |
| Containerization | Docker + docker-compose |
| Rate Limiting | express-rate-limit |

---

## 📁 Folder Structure

```
content-broadcasting-system/
│
├── prisma/
│   ├── schema.prisma              ← DB schema (users, content, slots, schedules, analytics)
│   └── seed.ts                    ← Seeds principal + 2 teachers with Password123!
│
├── src/
│   ├── config/
│   │   └── env.ts                 ← Zod-validated env vars (fails fast on bad config)
│   │
│   ├── docs/
│   │   └── swagger.ts             ← OpenAPI 3 spec, tags, schemas, server info
│   │
│   ├── lib/
│   │   ├── prisma.ts              ← Singleton Prisma client (hot-reload safe)
│   │   ├── redis.ts               ← Redis client + cacheGet/cacheSet/cacheDel helpers
│   │   └── s3.ts                  ← AWS S3 upload, delete, signed URL helpers
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts     ← JWT verification → sets req.user
│   │   ├── rbac.middleware.ts     ← Role guard: isPrincipal / isTeacher / isPrincipalOrTeacher
│   │   ├── validate.middleware.ts ← Zod schema validation (body / query / params)
│   │   ├── upload.middleware.ts   ← Multer: file type + size validation, UUID filenames
│   │   ├── rateLimit.middleware.ts← globalRateLimit / authRateLimit / publicApiRateLimit
│   │   └── error.middleware.ts    ← Global error handler + 404 handler
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.schema.ts     ← Zod: registerSchema, loginSchema
│   │   │   ├── auth.service.ts    ← register(), login(), getMe()
│   │   │   ├── auth.controller.ts ← Thin HTTP layer
│   │   │   └── auth.route.ts      ← POST /register, POST /login, GET /me
│   │   │
│   │   ├── content/
│   │   │   ├── content.schema.ts  ← Zod: upload, query, approve schemas
│   │   │   ├── content.service.ts ← uploadContent(), reviewContent(), CRUD
│   │   │   ├── content.controller.ts
│   │   │   └── content.route.ts   ← POST /upload, GET /my, GET /, PATCH /:id/review
│   │   │
│   │   ├── broadcasting/
│   │   │   ├── broadcasting.service.ts ← getLiveContent(), cache logic, teacher resolution
│   │   │   ├── broadcasting.controller.ts
│   │   │   └── broadcasting.route.ts   ← GET /content/live/:teacherId (PUBLIC)
│   │   │
│   │   ├── scheduling/
│   │   │   ├── scheduling.service.ts   ←  Core rotation algorithm (epoch-based)
│   │   │   └── scheduling.route.ts     ← GET /api/scheduling/slots
│   │   │
│   │   ├── analytics/
│   │   │   ├── analytics.service.ts   ← getMostActiveSubjects(), getContentUsage()
│   │   │   ├── analytics.controller.ts
│   │   │   └── analytics.route.ts     ← GET /global, /subjects, /me, /usage
│   │   │
│   │   └── users/
│   │       ├── user.service.ts    ← getAllTeachers(), getUserById()
│   │       ├── user.controller.ts
│   │       └── user.route.ts      ← GET /teachers, GET /:id
│   │
│   ├── common/
│   │   ├── asyncHandler.ts        ← Wraps async controllers, sendSuccess(), sendPaginated()
│   │   └── errors.ts              ← AppError, ValidationError, UnauthorizedError, etc.
│   │
│   ├── routes/
│   │   └── index.ts               ← Mounts all module routes + health check
│   │
│   ├── types/
│   │   └── express.d.ts           ← Augments Express Request with req.user
│   │
│   ├── app.ts                     ← Express setup: helmet, cors, morgan, swagger, routes
│   └── server.ts                  ← Bootstrap: DB connect, Redis connect, graceful shutdown
│
├── tests/
│   ├── globalSetup.cjs            ← Jest env var setup
│   ├── setupEnv.ts                ← dotenv for .env.test
│   ├── health.test.ts             ← Health endpoint + 404 tests
│   └── integration/
│       └── app.integration.test.ts ← Auth flow, RBAC, public API edge cases
│
├── uploads/
│   └── .gitkeep                   ← Placeholder (actual files gitignored)
│
├── .env.example                   ← Template with all required env vars + S3 guide
├── .gitignore
├── Dockerfile                     ← Multi-stage: builder → lean production image
├── docker-compose.yml             ← postgres + redis + app + migrate services
├── jest.config.ts
├── package.json
├── tsconfig.json
├── README.md                      ← Full setup guide, API usage, S3 setup for beginners
├── architecture-notes.txt         ← Required by assignment: all design decisions
└── interview-prep.txt             ← 34 Q&A covering all system aspects
```

---

## ⚡ Quick Start (Local without Docker)

### Prerequisites
- Node.js 20+
- PostgreSQL 16
- Redis (optional — caching gracefully disabled if absent)

### 1. Clone and install

```bash
git clone https://github.com/SparshSPradhan/content-broadcasting-system.git
cd content-broadcasting-system
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your database URL and JWT secret
```

Minimum required `.env`:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/content_broadcasting
JWT_SECRET=your-super-secret-key-minimum-32-characters-long!!
```

### 3. Generate JWT secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Set up the database

```bash
# Run migrations
npx prisma migrate dev --name init

# Seed default users
npx ts-node prisma/seed.ts
```

### 5. Start the dev server

```bash
npm run dev
```

App runs at: http://localhost:3000  
Swagger docs: http://localhost:3000/api/docs

---

## 🐳 Quick Start (Docker — Recommended)

```bash
# 1. Copy env file
cp .env.example .env

# 2. Set a secure JWT secret in .env:
#    JWT_SECRET=<output of the openssl command below>
openssl rand -hex 64

# 3. Start all services (app + postgres + redis + migrations)
docker-compose up --build

# App: http://localhost:3000
# Docs: http://localhost:3000/api/docs
```

To stop:
```bash
docker-compose down
```

To reset all data:
```bash
docker-compose down -v   # removes volumes too
docker-compose up --build
```

---

## 🔑 Default Seed Credentials

After running seed, these users are available:

| Role | Email | Password |
|------|-------|----------|
| Principal | principal@school.com | Password123! |
| Teacher 1 | teacher1@school.com | Password123! |
| Teacher 2 | teacher2@school.com | Password123! |

---

## 📖 API Usage

### Base URL
```
http://localhost:3000
```

### Authentication
All protected routes require:
```
Authorization: Bearer <token>
```

Get a token by calling **POST /api/auth/login**.

---

### Auth Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@school.com",
  "password": "Password123!",
  "role": "teacher"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "teacher1@school.com",
  "password": "Password123!"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "id": "uuid", "name": "Teacher One", "role": "teacher" }
  }
}
```

---

### Teacher: Upload Content

```http
POST /api/content/upload
Authorization: Bearer <teacher-token>
Content-Type: multipart/form-data

title=Maths Chapter 1
subject=maths
description=Introduction to algebra
file=<image file>
startTime=2024-01-01T09:00:00.000Z
endTime=2024-01-01T17:00:00.000Z
rotationDuration=5
```

- `file`: JPG, PNG, or GIF. Max 10MB.
- `startTime` / `endTime`: ISO 8601 format. Required for content to go live.
- `rotationDuration`: Minutes this content stays "on air" per cycle.

---

### Teacher: View My Content

```http
GET /api/content/my?page=1&limit=10&subject=maths&status=approved
Authorization: Bearer <teacher-token>
```

---

### Principal: Approve / Reject Content

```http
PATCH /api/content/:id/review
Authorization: Bearer <principal-token>
Content-Type: application/json

{
  "action": "approve"
}
```

```http
PATCH /api/content/:id/review
Authorization: Bearer <principal-token>
Content-Type: application/json

{
  "action": "reject",
  "rejectionReason": "File quality is too low"
}
```

---

### 📡 Public Broadcasting API (No Auth Required)

#### By teacher UUID:
```http
GET /content/live/550e8400-e29b-41d4-a716-446655440000
```

#### By sequential ID:
```http
GET /content/live/teacher-1
GET /content/live/teacher-2
```

#### Filter by subject:
```http
GET /content/live/teacher-1?subject=maths
```

**Response (content available):**
```json
{
  "success": true,
  "available": true,
  "message": "Live content retrieved",
  "teacher": { "id": "uuid", "name": "Teacher One" },
  "data": [
    {
      "id": "uuid",
      "title": "Maths Chapter 1",
      "subject": "maths",
      "fileUrl": "/uploads/abc.png",
      "startTime": "2024-01-01T09:00:00.000Z",
      "endTime": "2024-01-01T17:00:00.000Z"
    }
  ]
}
```

**Response (no content):**
```json
{
  "success": true,
  "available": false,
  "message": "No content available",
  "data": null
}
```

---

### Analytics Endpoints

```http
# Principal: global analytics
GET /api/analytics/global?days=30

# Principal: most active subjects
GET /api/analytics/subjects

# Teacher: own analytics summary
GET /api/analytics/me

# Usage tracking (teacher sees own, principal can filter by teacherId)
GET /api/analytics/usage?subject=maths&days=7
```

---

## 📦 File Storage Strategy

- By default, files are stored locally using Multer in the `/uploads` directory.
- If `USE_S3=true`, files are uploaded to AWS S3 and a public URL is stored.
- The system supports hybrid storage (local + S3) for flexibility and fallback.

This design allows:
- Easy local development without AWS setup
- Seamless migration to cloud storage in production


## ⚙️ AWS S3 Setup (Optional / Bonus)

⚠️ Note: S3 is optional. By default, the system uses local file storage (Multer).
To enable S3, set USE_S3=true and configure AWS credentials.

> ⚠️ Note:
> This project works fully with local file storage using Multer.
> AWS S3 integration is provided as an optional extension and is not required to run the system.
> If S3 is not configured, files are stored locally in the `/uploads` directory.

**1. Create an AWS account** at https://aws.amazon.com

**2. Create an S3 bucket:**
- Go to S3 → Create bucket
- Choose a name (e.g., `my-school-content`)
- Choose your region (e.g., `ap-south-1` for India)
- **Uncheck** "Block all public access" if you want files to be publicly readable
- Create bucket

**3. Set bucket policy for public read (optional):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

**4. Create an IAM user:**
- Go to IAM → Users → Create user
- Attach policy: `AmazonS3FullAccess` (or create a custom policy for least privilege)
- Go to Security credentials → Create access key
- Download the Access Key ID and Secret Access Key

**5. Update your .env:**
```env
USE_S3=true
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_BUCKET_NAME=my-school-content
```

**6. Files will now be stored in S3**, and `file_url` in the database will point to the S3 URL.

---

## 🧪 Running Tests

```bash
# Make sure .env is set up
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## 📋 All Available Commands

```bash
npm run dev                 # Start dev server with hot reload
npm run build               # Compile TypeScript to dist/
npm run start               # Run compiled production build
npm run prisma:generate     # Regenerate Prisma client
npm run prisma:migrate:dev  # Create + apply a new migration
npm run prisma:migrate      # Apply migrations (production)
npm run prisma:seed         # Seed the database
npm run prisma:studio       # Open Prisma Studio (GUI)
npm test                    # Run all tests
npm run test:coverage       # Tests with coverage report
```

---

## 📚 API Documentation (Swagger)

Full interactive API docs available at:
```
http://localhost:3000/api/docs
```

Raw OpenAPI JSON:
```
http://localhost:3000/api/docs.json
```

---

## 🔒 Security Features

- JWT authentication with configurable expiry
- bcrypt password hashing (12 rounds)
- Role-Based Access Control (RBAC) on all protected routes
- Helmet.js security headers
- CORS configuration
- Rate limiting: global (100/15min), auth (10/15min), public API (30/15min)
- File type and size validation
- No sensitive data (password hashes) in API responses
- Non-root Docker user

---

## ⚠️ Assumptions & Decisions

1. **Status flow**: Content is set to `pending` immediately on upload (not `uploaded`), which maps to the Principal's "pending review" queue.
2. **Time windows required**: Content without both `startTime` and `endTime` is never shown live (as per spec: "Without start_time/end_time → content is not active").
3. **Rotation epoch**: The start of the rotation cycle is the earliest `startTime` among live content items for that subject. This ensures deterministic, time-based rotation.
4. **Public API always 200**: The `/content/live` endpoint returns HTTP 200 even when no content is available — the `available: false` flag signals this to clients. This is intentional to avoid errors in student apps.
5. **Redis optional**: If Redis is unavailable, the system works without caching. No crashes.
6. **S3 + local**: When S3 is enabled, files are uploaded to S3 but the local file path is also retained in the DB as a fallback reference.
7. **Sequential teacher IDs**: `teacher-1`, `teacher-2` map to teachers ordered by `createdAt`. This is a convenience for demo; production should always use UUIDs.
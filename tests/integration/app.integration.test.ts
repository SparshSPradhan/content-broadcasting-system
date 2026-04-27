import request from 'supertest';
import app from '../../src/app';

// ─── Why lazy imports? ────────────────────────────────────────────────────────
// PrismaClient reads DATABASE_URL the moment the module is imported.
// Dynamic import() inside async functions guarantees env vars from
// setupEnv.ts are already set before PrismaClient initialises.
// ─────────────────────────────────────────────────────────────────────────────

async function getPrisma() {
  const mod = await import('../../src/lib/prisma');
  return mod.prisma;
}

async function cleanTestData() {
  const prisma = await getPrisma();
  await prisma.contentAnalytics.deleteMany();
  await prisma.contentSchedule.deleteMany();
  await prisma.content.deleteMany();
  await prisma.contentSlot.deleteMany();
  await prisma.user.deleteMany({ where: { email: { endsWith: '@test.com' } } });
}

// Skip DB tests when DATABASE_URL is not set
const DB_AVAILABLE = !!process.env.DATABASE_URL;
const itDb = DB_AVAILABLE ? it : it.skip;

// ─────────────────────────────────────────────────────────────────────────────

describe('Integration: Auth + Content Broadcasting Flow', () => {
  let principalToken: string = '';
  let teacherToken: string  = '';
  let teacherId: string     = '';

  beforeAll(async () => {
    if (!DB_AVAILABLE) {
      console.warn('⚠️  DATABASE_URL not set — DB tests will be skipped.');
      return;
    }
    const prisma = await getPrisma();
    const { hash } = await import('bcrypt');
    await cleanTestData();

    await prisma.user.create({
      data: {
        name: 'Test Principal',
        email: 'principal@test.com',
        passwordHash: await hash('Password123!', 4),
        role: 'principal',
      },
    });

    const teacher = await prisma.user.create({
      data: {
        name: 'Test Teacher',
        email: 'teacher@test.com',
        passwordHash: await hash('Password123!', 4),
        role: 'teacher',
      },
    });
    teacherId = teacher.id;
  });

  afterAll(async () => {
    if (!DB_AVAILABLE) return;
    await cleanTestData();
    const prisma = await getPrisma();
    await prisma.$disconnect();
  });

  // ── Health (no DB needed) ──────────────────────────────────────────────────

  describe('Health Check', () => {
    it('GET /health returns 200', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Unknown route returns 404', async () => {
      const res = await request(app).get('/api/totally-unknown-xyz');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ── Auth (requires DB) ─────────────────────────────────────────────────────

  describe('Auth Module', () => {
    itDb('should login as principal and receive a token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'principal@test.com', password: 'Password123!' });
      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('principal');
      principalToken = res.body.data.token;
    });

    itDb('should login as teacher and receive a token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'teacher@test.com', password: 'Password123!' });
      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      teacherToken = res.body.data.token;
    });

    itDb('should reject invalid password with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'teacher@test.com', password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });

    it('should return 401 for /api/auth/me without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return 401 for malformed token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not-a-real-token');
      expect(res.status).toBe(401);
    });

    itDb('should return profile for /api/auth/me with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('teacher');
    });

    it('should validate registration — missing fields returns 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'bad' });
      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should validate registration — weak password returns 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'X', email: 'x@test.com', password: 'weak', role: 'teacher' });
      expect(res.status).toBe(400);
    });

    it('should validate login — invalid email format returns 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'Password123!' });
      expect(res.status).toBe(400);
    });
  });

  // ── RBAC (requires tokens from Auth tests above) ───────────────────────────

  describe('RBAC', () => {
    itDb('teacher cannot access GET /api/content (principal only)', async () => {
      const res = await request(app)
        .get('/api/content')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(403);
    });

    itDb('principal can access GET /api/content', async () => {
      const res = await request(app)
        .get('/api/content')
        .set('Authorization', `Bearer ${principalToken}`);
      expect(res.status).toBe(200);
    });

    itDb('principal cannot upload content (teacher only) → 403', async () => {
      const res = await request(app)
        .post('/api/content/upload')
        .set('Authorization', `Bearer ${principalToken}`)
        .field('title', 'test')
        .field('subject', 'maths');
      expect(res.status).toBe(403);
    });

    it('unauthenticated upload returns 401', async () => {
      const res = await request(app).post('/api/content/upload');
      expect(res.status).toBe(401);
    });

    itDb('teacher cannot access /api/analytics/global → 403', async () => {
      const res = await request(app)
        .get('/api/analytics/global')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(403);
    });

    itDb('principal can access /api/analytics/global', async () => {
      const res = await request(app)
        .get('/api/analytics/global')
        .set('Authorization', `Bearer ${principalToken}`);
      expect(res.status).toBe(200);
    });

    itDb('teacher cannot list all teachers → 403', async () => {
      const res = await request(app)
        .get('/api/users/teachers')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(403);
    });

    itDb('principal can list all teachers', async () => {
      const res = await request(app)
        .get('/api/users/teachers')
        .set('Authorization', `Bearer ${principalToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ── Public Broadcasting API — Edge Cases ──────────────────────────────────

  describe('Public Broadcasting API — Edge Cases', () => {
    itDb('teacher with no approved content → 200 available:false', async () => {
      const res = await request(app).get(`/content/live/${teacherId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.available).toBe(false);
      expect(res.body.message).toBe('No content available');
      expect(res.body.data).toBeNull();
    });

    it('teacher-9999 (non-existent) → 200 available:false (not 404)', async () => {
      const res = await request(app).get('/content/live/teacher-9999');
      expect(res.status).toBe(200);
      expect(res.body.available).toBe(false);
    });

    it('completely unknown identifier → 200 available:false', async () => {
      const res = await request(app).get('/content/live/completely-unknown-abc');
      expect(res.status).toBe(200);
      expect(res.body.available).toBe(false);
    });

    itDb('invalid subject filter → 200 available:false', async () => {
      const res = await request(app)
        .get(`/content/live/${teacherId}`)
        .query({ subject: 'subjectdoesnotexist' });
      expect(res.status).toBe(200);
      expect(res.body.available).toBe(false);
    });

    it('teacher-1 format resolves and returns valid shape', async () => {
      const res = await request(app).get('/content/live/teacher-1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(['No content available', 'Live content retrieved']).toContain(res.body.message);
    });
  });
});
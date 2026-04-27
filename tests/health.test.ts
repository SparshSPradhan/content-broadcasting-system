import request from 'supertest';
import app from '../src/app';

describe('Health Check', () => {
    console.log('DB URL:', process.env.DATABASE_URL);
  it('GET /health should return 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('running');
  });

  it('GET /unknown-route should return 404', async () => {
    const res = await request(app).get('/api/unknown-route-xyz');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
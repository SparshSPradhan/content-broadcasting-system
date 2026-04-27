module.exports = async function () {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
    process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long!!';
    process.env.PORT = '3001';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.USE_S3 = 'false';
    process.env.UPLOAD_DIR = 'uploads/test';
  };
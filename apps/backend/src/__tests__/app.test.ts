import request from 'supertest';
import express from 'express';
import cors from 'cors';
import routes from '../routes';

describe('Backend App', () => {
  let app: express.Application;

  beforeAll(() => {
    // Create a test app similar to the main app but without listening
    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api', routes);
    
    // Health check route
    app.get('/health', (req, res) => {
      res.json({ status: 'ok' });
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('JSON Parsing', () => {
    it('should parse JSON body correctly', async () => {
      const testData = { test: 'data' };
      const response = await request(app)
        .post('/api/trust/analyze')
        .send(testData)
        .expect(400); // Expected to fail due to validation, but should parse JSON

      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('404 Handling', () => {
    it('should return 404 for unknown routes', async () => {
      await request(app)
        .get('/unknown-route')
        .expect(404);
    });
  });
});
const request = require('supertest');
const app = require('../src/app');
const DNSRecord = require('../src/models/DNSRecord');

// Mock DNSRecord model to isolate tests from the database
jest.mock('../src/models/DNSRecord');

describe('DNS API Unit Tests (Mocked)', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/dns', () => {
    it('should create a valid A record', async () => {
      // Mock findOne to return nothing (no conflicts)
      DNSRecord.findOne.mockResolvedValue(null);
      DNSRecord.find.mockResolvedValue([]);
      
      // Mock the save instance method
      DNSRecord.prototype.save = jest.fn().mockResolvedValue({
        hostname: 'example.com',
        type: 'A',
        value: '1.2.3.4',
        createdAt: new Date()
      });

      const res = await request(app)
        .post('/api/dns')
        .send({ hostname: 'example.com', type: 'A', value: '1.2.3.4' });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.hostname).toBe('example.com');
    });

    it('should fail if hostname exists as CNAME', async () => {
      // Mock CNAME existence to trigger exclusivity conflict
      DNSRecord.findOne.mockImplementation(({ hostname, type }) => {
        if (type === 'CNAME') return Promise.resolve({ hostname, type: 'CNAME' });
        return Promise.resolve(null);
      });
      DNSRecord.find.mockResolvedValue([{ type: 'CNAME' }]);

      const res = await request(app)
        .post('/api/dns')
        .send({ hostname: 'example.com', type: 'A', value: '1.2.3.4' });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toContain('Cannot add A record when CNAME exists');
    });
  });

  describe('GET /api/dns/:hostname', () => {
    it('should follow CNAME chains successfully', async () => {
      // Mock chain: a.com -> b.com -> 8.8.8.8
      DNSRecord.find.mockImplementation(({ hostname, type }) => {
        if (hostname === 'a.com' && type === 'A') return Promise.resolve([]);
        if (hostname === 'b.com' && type === 'A') return Promise.resolve([{ value: '8.8.8.8' }]);
        return Promise.resolve([]);
      });

      DNSRecord.findOne.mockImplementation(({ hostname, type }) => {
        if (hostname === 'a.com' && type === 'CNAME') return Promise.resolve({ value: 'b.com' });
        return Promise.resolve(null);
      });

      const res = await request(app).get('/api/dns/a.com');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.resolvedIps).toContain('8.8.8.8');
      expect(res.body.pointsTo).toBe('b.com');
    });

    it('should detect circular references', async () => {
      // Mock loop: a.com -> b.com -> a.com
      DNSRecord.find.mockResolvedValue([]);
      DNSRecord.findOne.mockImplementation(({ hostname }) => {
        if (hostname === 'a.com') return Promise.resolve({ hostname: 'a.com', type: 'CNAME', value: 'b.com' });
        if (hostname === 'b.com') return Promise.resolve({ hostname: 'b.com', type: 'CNAME', value: 'a.com' });
        return Promise.resolve(null);
      });

      const res = await request(app).get('/api/dns/a.com');
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toContain('Circular CNAME reference');
    });
  });
});

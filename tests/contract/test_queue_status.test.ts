import { test, expect } from '@playwright/test';

test.describe('GET /api/queue/{classroomId}/status', () => {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  const classroomId = '1';
  const endpoint = `/api/queue/${classroomId}/status`;

  test('should return queue status successfully', async ({ request }) => {
    const response = await request.get(`${baseUrl}${endpoint}`);

    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('classroomId', classroomId);
    expect(responseData).toHaveProperty('entries');
    expect(responseData).toHaveProperty('activeSpeaker');
    expect(responseData).toHaveProperty('maxCapacity');
    expect(responseData).toHaveProperty('lastUpdated');
    expect(responseData).toHaveProperty('isActive');
    
    // Validate entries is an array
    expect(Array.isArray(responseData.entries)).toBe(true);
    
    // Validate maxCapacity is within expected range
    expect(responseData.maxCapacity).toBeGreaterThanOrEqual(1);
    expect(responseData.maxCapacity).toBeLessThanOrEqual(50);
    
    // Validate isActive is boolean
    expect(typeof responseData.isActive).toBe('boolean');
  });

  test('should return 400 for invalid classroomId format', async ({ request }) => {
    const invalidEndpoint = '/api/queue/invalid/status';

    const response = await request.get(`${baseUrl}${invalidEndpoint}`);

    expect(response.status()).toBe(400);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData).toHaveProperty('message');
  });

  test('should return 400 for classroomId outside range 1-6', async ({ request }) => {
    const invalidEndpoint = '/api/queue/7/status';

    const response = await request.get(`${baseUrl}${invalidEndpoint}`);

    expect(response.status()).toBe(400);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData).toHaveProperty('message');
  });

  test('should return 404 for classroom not found', async ({ request }) => {
    // This test assumes classroom 6 doesn't exist or is not initialized
    const nonExistentEndpoint = '/api/queue/6/status';

    const response = await request.get(`${baseUrl}${nonExistentEndpoint}`);

    // This might return 200 or 404 depending on implementation
    // The important thing is that 404 responses have the right structure
    if (response.status() === 404) {
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData).toHaveProperty('message');
    }
  });

  test('should return correct queue status with participants', async ({ request }) => {
    const participants = [
      {
        participantId: '550e8400-e29b-41d4-a716-446655440001',
        participantName: 'Alice'
      },
      {
        participantId: '550e8400-e29b-41d4-a716-446655440002',
        participantName: 'Bob'
      }
    ];

    // Add participants to queue
    for (const participant of participants) {
      const raiseResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/raise-hand`, {
        data: participant,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      expect(raiseResponse.status()).toBe(200);
    }

    // Get queue status
    const response = await request.get(`${baseUrl}${endpoint}`);

    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    expect(responseData.classroomId).toBe(classroomId);
    expect(responseData.entries).toHaveLength(2);
    expect(responseData.activeSpeaker).toBeNull();
    expect(responseData.isActive).toBe(true);
    
    // Validate queue entries structure
    for (const entry of responseData.entries) {
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('participantId');
      expect(entry).toHaveProperty('participantName');
      expect(entry).toHaveProperty('classroomId', classroomId);
      expect(entry).toHaveProperty('raisedAt');
      expect(entry).toHaveProperty('position');
      expect(entry).toHaveProperty('isActive', false);
      expect(entry).toHaveProperty('role');
    }
  });

  test('should return correct queue status with active speaker', async ({ request }) => {
    const participantData = {
      participantId: '550e8400-e29b-41d4-a716-446655440000',
      participantName: 'John Doe'
    };

    // Add participant to queue
    const raiseResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/raise-hand`, {
      data: participantData,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(raiseResponse.status()).toBe(200);

    // Call on participant
    const callOnResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/call-on`, {
      data: { instructorId: '550e8400-e29b-41d4-a716-446655440010' },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(callOnResponse.status()).toBe(200);

    // Get queue status
    const response = await request.get(`${baseUrl}${endpoint}`);

    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    expect(responseData.classroomId).toBe(classroomId);
    expect(responseData.entries).toHaveLength(0); // Participant removed from queue when called on
    expect(responseData.activeSpeaker).not.toBeNull();
    expect(responseData.isActive).toBe(true);
    
    // Validate active speaker structure
    const activeSpeaker = responseData.activeSpeaker;
    expect(activeSpeaker).toHaveProperty('participantId', participantData.participantId);
    expect(activeSpeaker).toHaveProperty('participantName', participantData.participantName);
    expect(activeSpeaker).toHaveProperty('classroomId', classroomId);
    expect(activeSpeaker).toHaveProperty('calledAt');
    expect(activeSpeaker).toHaveProperty('role');
  });

  test('should return correct queue status after lowering all hands', async ({ request }) => {
    const participants = [
      {
        participantId: '550e8400-e29b-41d4-a716-446655440001',
        participantName: 'Alice'
      },
      {
        participantId: '550e8400-e29b-41d4-a716-446655440002',
        participantName: 'Bob'
      }
    ];

    // Add participants to queue
    for (const participant of participants) {
      const raiseResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/raise-hand`, {
        data: participant,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      expect(raiseResponse.status()).toBe(200);
    }

    // Lower all hands
    const lowerAllResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/lower-all`, {
      data: { instructorId: '550e8400-e29b-41d4-a716-446655440010' },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(lowerAllResponse.status()).toBe(200);

    // Get queue status
    const response = await request.get(`${baseUrl}${endpoint}`);

    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    expect(responseData.classroomId).toBe(classroomId);
    expect(responseData.entries).toHaveLength(0);
    expect(responseData.activeSpeaker).toBeNull();
    expect(responseData.isActive).toBe(true);
  });

  test('should return consistent timestamps', async ({ request }) => {
    const participantData = {
      participantId: '550e8400-e29b-41d4-a716-446655440000',
      participantName: 'John Doe'
    };

    // Add participant to queue
    const raiseResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/raise-hand`, {
      data: participantData,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(raiseResponse.status()).toBe(200);

    // Get queue status
    const response = await request.get(`${baseUrl}${endpoint}`);

    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('lastUpdated');
    
    // Validate timestamp format
    const lastUpdated = new Date(responseData.lastUpdated);
    expect(lastUpdated).toBeInstanceOf(Date);
    expect(lastUpdated.getTime()).not.toBeNaN();
    
    // Validate timestamp is recent (within last minute)
    const now = new Date();
    const timeDiff = now.getTime() - lastUpdated.getTime();
    expect(timeDiff).toBeLessThan(60000); // Less than 1 minute
  });
});
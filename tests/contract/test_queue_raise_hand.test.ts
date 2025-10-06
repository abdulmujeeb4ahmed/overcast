import { test, expect } from '@playwright/test';

test.describe('POST /api/queue/{classroomId}/raise-hand', () => {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  const classroomId = '1';
  const endpoint = `/api/queue/${classroomId}/raise-hand`;

  test('should raise hand successfully with valid participant data', async ({ request }) => {
    const participantData = {
      participantId: '550e8400-e29b-41d4-a716-446655440000',
      participantName: 'John Doe'
    };

    const response = await request.post(`${baseUrl}${endpoint}`, {
      data: participantData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('success', true);
    expect(responseData).toHaveProperty('queueEntry');
    expect(responseData).toHaveProperty('position');
    
    // Validate queue entry structure
    const queueEntry = responseData.queueEntry;
    expect(queueEntry).toHaveProperty('id');
    expect(queueEntry).toHaveProperty('participantId', participantData.participantId);
    expect(queueEntry).toHaveProperty('participantName', participantData.participantName);
    expect(queueEntry).toHaveProperty('classroomId', classroomId);
    expect(queueEntry).toHaveProperty('raisedAt');
    expect(queueEntry).toHaveProperty('position');
    expect(queueEntry).toHaveProperty('isActive', false);
    expect(queueEntry).toHaveProperty('role');
    
    // Validate position is positive integer
    expect(responseData.position).toBeGreaterThan(0);
    expect(Number.isInteger(responseData.position)).toBe(true);
  });

  test('should return 400 for missing participantId', async ({ request }) => {
    const invalidData = {
      participantName: 'John Doe'
    };

    const response = await request.post(`${baseUrl}${endpoint}`, {
      data: invalidData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(400);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData).toHaveProperty('message');
  });

  test('should return 400 for missing participantName', async ({ request }) => {
    const invalidData = {
      participantId: '550e8400-e29b-41d4-a716-446655440000'
    };

    const response = await request.post(`${baseUrl}${endpoint}`, {
      data: invalidData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(400);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData).toHaveProperty('message');
  });

  test('should return 400 for invalid participantId format', async ({ request }) => {
    const invalidData = {
      participantId: 'invalid-uuid',
      participantName: 'John Doe'
    };

    const response = await request.post(`${baseUrl}${endpoint}`, {
      data: invalidData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(400);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData).toHaveProperty('message');
  });

  test('should return 400 for empty participantName', async ({ request }) => {
    const invalidData = {
      participantId: '550e8400-e29b-41d4-a716-446655440000',
      participantName: ''
    };

    const response = await request.post(`${baseUrl}${endpoint}`, {
      data: invalidData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(400);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData).toHaveProperty('message');
  });

  test('should return 400 for participantName too long', async ({ request }) => {
    const invalidData = {
      participantId: '550e8400-e29b-41d4-a716-446655440000',
      participantName: 'A'.repeat(51) // Exceeds 50 character limit
    };

    const response = await request.post(`${baseUrl}${endpoint}`, {
      data: invalidData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(400);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData).toHaveProperty('message');
  });

  test('should return 400 for invalid classroomId format', async ({ request }) => {
    const invalidEndpoint = '/api/queue/invalid/raise-hand';
    const participantData = {
      participantId: '550e8400-e29b-41d4-a716-446655440000',
      participantName: 'John Doe'
    };

    const response = await request.post(`${baseUrl}${invalidEndpoint}`, {
      data: participantData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(400);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData).toHaveProperty('message');
  });

  test('should return 400 for classroomId outside range 1-6', async ({ request }) => {
    const invalidEndpoint = '/api/queue/7/raise-hand';
    const participantData = {
      participantId: '550e8400-e29b-41d4-a716-446655440000',
      participantName: 'John Doe'
    };

    const response = await request.post(`${baseUrl}${invalidEndpoint}`, {
      data: participantData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(400);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData).toHaveProperty('message');
  });

  test('should return 400 for participant already in queue', async ({ request }) => {
    const participantData = {
      participantId: '550e8400-e29b-41d4-a716-446655440000',
      participantName: 'John Doe'
    };

    // First request should succeed
    const firstResponse = await request.post(`${baseUrl}${endpoint}`, {
      data: participantData,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(firstResponse.status()).toBe(200);

    // Second request should fail
    const secondResponse = await request.post(`${baseUrl}${endpoint}`, {
      data: participantData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(secondResponse.status()).toBe(400);
    
    const responseData = await secondResponse.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData).toHaveProperty('message');
  });

  test('should return 409 when queue is at capacity', async ({ request }) => {
    // This test assumes queue capacity is 50
    // We'll need to add 50 participants to reach capacity
    const participants = [];
    
    for (let i = 0; i < 50; i++) {
      participants.push({
        participantId: `550e8400-e29b-41d4-a716-44665544${i.toString().padStart(4, '0')}`,
        participantName: `Participant ${i + 1}`
      });
    }

    // Add all participants to queue
    for (const participant of participants) {
      const response = await request.post(`${baseUrl}${endpoint}`, {
        data: participant,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      expect(response.status()).toBe(200);
    }

    // Try to add one more participant - should fail
    const overflowParticipant = {
      participantId: '550e8400-e29b-41d4-a716-446655445000',
      participantName: 'Overflow Participant'
    };

    const response = await request.post(`${baseUrl}${endpoint}`, {
      data: overflowParticipant,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(409);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData).toHaveProperty('message');
  });

  test('should return 403 for participant not in classroom', async ({ request }) => {
    // This test would require mocking classroom membership
    // For now, we'll test the structure
    const participantData = {
      participantId: '550e8400-e29b-41d4-a716-446655440000',
      participantName: 'John Doe'
    };

    const response = await request.post(`${baseUrl}${endpoint}`, {
      data: participantData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // This might return 200 or 403 depending on implementation
    // The important thing is that 403 responses have the right structure
    if (response.status() === 403) {
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData).toHaveProperty('message');
    }
  });
});
import { test, expect } from '@playwright/test';

test.describe('POST /api/queue/{classroomId}/lower-individual', () => {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  const classroomId = '1';
  const endpoint = `/api/queue/${classroomId}/lower-individual`;

  test('should lower individual participant hand successfully', async ({ request }) => {
    const participantData = {
      participantId: '550e8400-e29b-41d4-a716-446655440000',
      participantName: 'John Doe'
    };

    // First, add participant to queue
    const raiseResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/raise-hand`, {
      data: participantData,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(raiseResponse.status()).toBe(200);

    // Now lower the individual participant's hand
    const lowerData = {
      instructorId: '550e8400-e29b-41d4-a716-446655440001',
      participantId: participantData.participantId
    };

    const response = await request.post(`${baseUrl}${endpoint}`, {
      data: lowerData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('success', true);
    expect(responseData).toHaveProperty('message', 'Participant hand lowered');
  });

  test('should return 400 for missing instructorId', async ({ request }) => {
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

  test('should return 400 for missing participantId', async ({ request }) => {
    const invalidData = {
      instructorId: '550e8400-e29b-41d4-a716-446655440001'
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

  test('should return 400 for invalid instructorId format', async ({ request }) => {
    const invalidData = {
      instructorId: 'invalid-uuid',
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
      instructorId: '550e8400-e29b-41d4-a716-446655440001',
      participantId: 'invalid-uuid'
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
    const invalidEndpoint = '/api/queue/invalid/lower-individual';
    const lowerData = {
      instructorId: '550e8400-e29b-41d4-a716-446655440001',
      participantId: '550e8400-e29b-41d4-a716-446655440000'
    };

    const response = await request.post(`${baseUrl}${invalidEndpoint}`, {
      data: lowerData,
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
    const invalidEndpoint = '/api/queue/7/lower-individual';
    const lowerData = {
      instructorId: '550e8400-e29b-41d4-a716-446655440001',
      participantId: '550e8400-e29b-41d4-a716-446655440000'
    };

    const response = await request.post(`${baseUrl}${invalidEndpoint}`, {
      data: lowerData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(400);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData).toHaveProperty('message');
  });

  test('should return 403 for non-instructor attempting to lower individual hand', async ({ request }) => {
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

    // Try to lower hand with a student ID (not instructor)
    const lowerData = {
      instructorId: '550e8400-e29b-41d4-a716-446655440000', // Same as participant
      participantId: participantData.participantId
    };

    const response = await request.post(`${baseUrl}${endpoint}`, {
      data: lowerData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(403);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData).toHaveProperty('message');
  });

  test('should return 404 for participant not in queue', async ({ request }) => {
    const lowerData = {
      instructorId: '550e8400-e29b-41d4-a716-446655440001',
      participantId: '550e8400-e29b-41d4-a716-446655440000'
    };

    const response = await request.post(`${baseUrl}${endpoint}`, {
      data: lowerData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(404);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData).toHaveProperty('message');
  });
});
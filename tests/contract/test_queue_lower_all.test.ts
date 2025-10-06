import { test, expect } from '@playwright/test';

test.describe('POST /api/queue/{classroomId}/lower-all', () => {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  const classroomId = '1';
  const endpoint = `/api/queue/${classroomId}/lower-all`;

  test('should lower all hands successfully', async ({ request }) => {
    const participants = [
      {
        participantId: '550e8400-e29b-41d4-a716-446655440001',
        participantName: 'Alice'
      },
      {
        participantId: '550e8400-e29b-41d4-a716-446655440002',
        participantName: 'Bob'
      },
      {
        participantId: '550e8400-e29b-41d4-a716-446655440003',
        participantName: 'Charlie'
      }
    ];

    // Add all participants to queue
    for (const participant of participants) {
      const raiseResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/raise-hand`, {
        data: participant,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      expect(raiseResponse.status()).toBe(200);
    }

    // Now lower all hands
    const lowerAllData = {
      instructorId: '550e8400-e29b-41d4-a716-446655440010'
    };

    const response = await request.post(`${baseUrl}${endpoint}`, {
      data: lowerAllData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('success', true);
    expect(responseData).toHaveProperty('loweredCount', 3);
    expect(responseData).toHaveProperty('message', 'All hands lowered');
  });

  test('should return 400 for missing instructorId', async ({ request }) => {
    const invalidData = {};

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
      instructorId: 'invalid-uuid'
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
    const invalidEndpoint = '/api/queue/invalid/lower-all';
    const lowerAllData = {
      instructorId: '550e8400-e29b-41d4-a716-446655440010'
    };

    const response = await request.post(`${baseUrl}${invalidEndpoint}`, {
      data: lowerAllData,
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
    const invalidEndpoint = '/api/queue/7/lower-all';
    const lowerAllData = {
      instructorId: '550e8400-e29b-41d4-a716-446655440010'
    };

    const response = await request.post(`${baseUrl}${invalidEndpoint}`, {
      data: lowerAllData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(400);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData).toHaveProperty('message');
  });

  test('should return 403 for non-instructor attempting to lower all hands', async ({ request }) => {
    const participants = [
      {
        participantId: '550e8400-e29b-41d4-a716-446655440001',
        participantName: 'Alice'
      }
    ];

    // Add participant to queue
    const raiseResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/raise-hand`, {
      data: participants[0],
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(raiseResponse.status()).toBe(200);

    // Try to lower all hands with a student ID (not instructor)
    const lowerAllData = {
      instructorId: '550e8400-e29b-41d4-a716-446655440001' // Same as participant
    };

    const response = await request.post(`${baseUrl}${endpoint}`, {
      data: lowerAllData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(403);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData).toHaveProperty('message');
  });

  test('should handle lowering all hands when queue is empty', async ({ request }) => {
    const lowerAllData = {
      instructorId: '550e8400-e29b-41d4-a716-446655440010'
    };

    const response = await request.post(`${baseUrl}${endpoint}`, {
      data: lowerAllData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('success', true);
    expect(responseData).toHaveProperty('loweredCount', 0);
    expect(responseData).toHaveProperty('message', 'All hands lowered');
  });

  test('should handle lowering all hands when there is an active speaker', async ({ request }) => {
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

    // Call on first participant (make them active speaker)
    const callOnResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/call-on`, {
      data: { instructorId: '550e8400-e29b-41d4-a716-446655440010' },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(callOnResponse.status()).toBe(200);

    // Now lower all hands
    const lowerAllData = {
      instructorId: '550e8400-e29b-41d4-a716-446655440010'
    };

    const response = await request.post(`${baseUrl}${endpoint}`, {
      data: lowerAllData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('success', true);
    expect(responseData).toHaveProperty('loweredCount', 1); // Only Bob in queue, Alice was active speaker
    expect(responseData).toHaveProperty('message', 'All hands lowered');
  });
});
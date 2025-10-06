import { test, expect } from '@playwright/test';

test.describe('POST /api/queue/{classroomId}/lower-hand', () => {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  const classroomId = '1';
  const endpoint = `/api/queue/${classroomId}/lower-hand`;

  test('should lower hand successfully for participant in queue', async ({ request }) => {
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

    // Now lower the hand
    const lowerData = {
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
    expect(responseData).toHaveProperty('message', 'Hand lowered successfully');
  });

  test('should return 400 for missing participantId', async ({ request }) => {
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

  test('should return 400 for invalid participantId format', async ({ request }) => {
    const invalidData = {
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
    const invalidEndpoint = '/api/queue/invalid/lower-hand';
    const lowerData = {
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
    const invalidEndpoint = '/api/queue/7/lower-hand';
    const lowerData = {
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

  test('should return 404 for participant not in queue', async ({ request }) => {
    const lowerData = {
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

  test('should handle multiple participants lowering hands independently', async ({ request }) => {
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

    // Lower Alice's hand
    const aliceLowerResponse = await request.post(`${baseUrl}${endpoint}`, {
      data: { participantId: participants[0].participantId },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(aliceLowerResponse.status()).toBe(200);

    // Bob and Charlie should still be in queue
    const statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    const statusData = await statusResponse.json();
    expect(statusData.entries).toHaveLength(2);
    
    const remainingParticipantIds = statusData.entries.map((entry: any) => entry.participantId);
    expect(remainingParticipantIds).toContain(participants[1].participantId);
    expect(remainingParticipantIds).toContain(participants[2].participantId);
    expect(remainingParticipantIds).not.toContain(participants[0].participantId);
  });

  test('should handle lowering hand for participant who is currently active speaker', async ({ request }) => {
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

    // Call on participant (make them active speaker)
    const callOnResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/call-on`, {
      data: { instructorId: '550e8400-e29b-41d4-a716-446655440001' },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(callOnResponse.status()).toBe(200);

    // Now try to lower their hand
    const lowerData = {
      participantId: participantData.participantId
    };

    const response = await request.post(`${baseUrl}${endpoint}`, {
      data: lowerData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // This should succeed and remove them from active speaker
    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('success', true);
    expect(responseData).toHaveProperty('message', 'Hand lowered successfully');
  });
});
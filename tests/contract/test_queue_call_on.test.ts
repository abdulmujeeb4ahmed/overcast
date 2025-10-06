import { test, expect } from '@playwright/test';

test.describe('POST /api/queue/{classroomId}/call-on', () => {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  const classroomId = '1';
  const endpoint = `/api/queue/${classroomId}/call-on`;

  test('should call on next participant successfully', async ({ request }) => {
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

    // Now call on the participant
    const callOnData = {
      instructorId: '550e8400-e29b-41d4-a716-446655440001'
    };

    const response = await request.post(`${baseUrl}${endpoint}`, {
      data: callOnData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('success', true);
    expect(responseData).toHaveProperty('activeSpeaker');
    expect(responseData).toHaveProperty('queueEntry');
    
    // Validate active speaker structure
    const activeSpeaker = responseData.activeSpeaker;
    expect(activeSpeaker).toHaveProperty('participantId', participantData.participantId);
    expect(activeSpeaker).toHaveProperty('participantName', participantData.participantName);
    expect(activeSpeaker).toHaveProperty('classroomId', classroomId);
    expect(activeSpeaker).toHaveProperty('calledAt');
    expect(activeSpeaker).toHaveProperty('role');
    
    // Validate queue entry structure
    const queueEntry = responseData.queueEntry;
    expect(queueEntry).toHaveProperty('id');
    expect(queueEntry).toHaveProperty('participantId', participantData.participantId);
    expect(queueEntry).toHaveProperty('participantName', participantData.participantName);
    expect(queueEntry).toHaveProperty('classroomId', classroomId);
    expect(queueEntry).toHaveProperty('raisedAt');
    expect(queueEntry).toHaveProperty('position');
    expect(queueEntry).toHaveProperty('isActive', true);
    expect(queueEntry).toHaveProperty('role');
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
    const invalidEndpoint = '/api/queue/invalid/call-on';
    const callOnData = {
      instructorId: '550e8400-e29b-41d4-a716-446655440001'
    };

    const response = await request.post(`${baseUrl}${invalidEndpoint}`, {
      data: callOnData,
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
    const invalidEndpoint = '/api/queue/7/call-on';
    const callOnData = {
      instructorId: '550e8400-e29b-41d4-a716-446655440001'
    };

    const response = await request.post(`${baseUrl}${invalidEndpoint}`, {
      data: callOnData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(400);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData).toHaveProperty('message');
  });

  test('should return 404 when no participants in queue', async ({ request }) => {
    const callOnData = {
      instructorId: '550e8400-e29b-41d4-a716-446655440001'
    };

    const response = await request.post(`${baseUrl}${endpoint}`, {
      data: callOnData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(404);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData).toHaveProperty('message');
  });

  test('should return 403 for non-instructor attempting to call on', async ({ request }) => {
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

    // Try to call on with a student ID (not instructor)
    const callOnData = {
      instructorId: '550e8400-e29b-41d4-a716-446655440000' // Same as participant
    };

    const response = await request.post(`${baseUrl}${endpoint}`, {
      data: callOnData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(403);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData).toHaveProperty('message');
  });

  test('should call on participants in FIFO order', async ({ request }) => {
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

    // Add participants to queue in order
    for (const participant of participants) {
      const raiseResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/raise-hand`, {
        data: participant,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      expect(raiseResponse.status()).toBe(200);
    }

    // Call on first participant (Alice)
    const firstCallOnResponse = await request.post(`${baseUrl}${endpoint}`, {
      data: { instructorId: '550e8400-e29b-41d4-a716-446655440010' },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(firstCallOnResponse.status()).toBe(200);
    
    const firstResponseData = await firstCallOnResponse.json();
    expect(firstResponseData.activeSpeaker.participantId).toBe(participants[0].participantId);

    // Check queue status - Alice should be active speaker, Bob and Charlie in queue
    const statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    const statusData = await statusResponse.json();
    expect(statusData.activeSpeaker.participantId).toBe(participants[0].participantId);
    expect(statusData.entries).toHaveLength(2);
    expect(statusData.entries[0].participantId).toBe(participants[1].participantId); // Bob first
    expect(statusData.entries[1].participantId).toBe(participants[2].participantId); // Charlie second
  });

  test('should handle calling on when there is already an active speaker', async ({ request }) => {
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

    // Call on first participant (Alice)
    const firstCallOnResponse = await request.post(`${baseUrl}${endpoint}`, {
      data: { instructorId: '550e8400-e29b-41d4-a716-446655440010' },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(firstCallOnResponse.status()).toBe(200);

    // Try to call on second participant while Alice is still active
    const secondCallOnResponse = await request.post(`${baseUrl}${endpoint}`, {
      data: { instructorId: '550e8400-e29b-41d4-a716-446655440010' },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // This should either succeed (replacing Alice) or return an error
    // The exact behavior depends on implementation
    expect([200, 400, 409]).toContain(secondCallOnResponse.status());
  });
});
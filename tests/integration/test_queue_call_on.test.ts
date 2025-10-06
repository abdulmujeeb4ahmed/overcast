import { test, expect } from '@playwright/test';

test.describe('Queue Call On Integration Flow', () => {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  const classroomId = '1';

  test('should complete full call on flow', async ({ request }) => {
    const participantData = {
      participantId: '550e8400-e29b-41d4-a716-446655440000',
      participantName: 'John Doe'
    };

    const instructorId = '550e8400-e29b-41d4-a716-446655440010';

    // Step 1: Add participant to queue
    const raiseResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/raise-hand`, {
      data: participantData,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(raiseResponse.status()).toBe(200);

    // Step 2: Verify participant is in queue
    let statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    let statusData = await statusResponse.json();
    expect(statusData.entries).toHaveLength(1);
    expect(statusData.activeSpeaker).toBeNull();

    // Step 3: Call on participant
    const callOnResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/call-on`, {
      data: { instructorId },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(callOnResponse.status()).toBe(200);
    
    const callOnData = await callOnResponse.json();
    expect(callOnData.success).toBe(true);
    expect(callOnData.activeSpeaker.participantId).toBe(participantData.participantId);
    expect(callOnData.queueEntry.participantId).toBe(participantData.participantId);
    expect(callOnData.queueEntry.isActive).toBe(true);

    // Step 4: Verify participant is now active speaker and removed from queue
    statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    statusData = await statusResponse.json();
    expect(statusData.entries).toHaveLength(0);
    expect(statusData.activeSpeaker).not.toBeNull();
    expect(statusData.activeSpeaker.participantId).toBe(participantData.participantId);
  });

  test('should handle call on with multiple participants in queue', async ({ request }) => {
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

    const instructorId = '550e8400-e29b-41d4-a716-446655440010';

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

    // Verify all participants are in queue
    let statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    let statusData = await statusResponse.json();
    expect(statusData.entries).toHaveLength(3);

    // Call on first participant (Alice)
    const callOnResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/call-on`, {
      data: { instructorId },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(callOnResponse.status()).toBe(200);
    
    const callOnData = await callOnResponse.json();
    expect(callOnData.activeSpeaker.participantId).toBe(participants[0].participantId);

    // Verify Alice is active speaker and Bob/Charlie remain in queue
    statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    statusData = await statusResponse.json();
    expect(statusData.activeSpeaker.participantId).toBe(participants[0].participantId);
    expect(statusData.entries).toHaveLength(2);
    expect(statusData.entries[0].participantId).toBe(participants[1].participantId); // Bob first
    expect(statusData.entries[1].participantId).toBe(participants[2].participantId); // Charlie second
  });

  test('should handle call on when no participants in queue', async ({ request }) => {
    const instructorId = '550e8400-e29b-41d4-a716-446655440010';

    // Verify queue is empty
    let statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    let statusData = await statusResponse.json();
    expect(statusData.entries).toHaveLength(0);

    // Try to call on when queue is empty
    const callOnResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/call-on`, {
      data: { instructorId },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(callOnResponse.status()).toBe(404);
  });

  test('should handle call on with invalid instructor ID', async ({ request }) => {
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

    // Try to call on with missing instructor ID
    const callOnResponse1 = await request.post(`${baseUrl}/api/queue/${classroomId}/call-on`, {
      data: {},
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(callOnResponse1.status()).toBe(400);

    // Try to call on with invalid instructor ID format
    const callOnResponse2 = await request.post(`${baseUrl}/api/queue/${classroomId}/call-on`, {
      data: { instructorId: 'invalid-uuid' },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(callOnResponse2.status()).toBe(400);
  });

  test('should handle call on with invalid classroom ID', async ({ request }) => {
    const instructorId = '550e8400-e29b-41d4-a716-446655440010';

    // Test with invalid classroom ID format
    const invalidEndpoint1 = '/api/queue/invalid/call-on';
    const response1 = await request.post(`${baseUrl}${invalidEndpoint1}`, {
      data: { instructorId },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(response1.status()).toBe(400);

    // Test with classroom ID outside range
    const invalidEndpoint2 = '/api/queue/7/call-on';
    const response2 = await request.post(`${baseUrl}${invalidEndpoint2}`, {
      data: { instructorId },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(response2.status()).toBe(400);
  });

  test('should handle call on when there is already an active speaker', async ({ request }) => {
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

    const instructorId = '550e8400-e29b-41d4-a716-446655440010';

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
    const firstCallOnResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/call-on`, {
      data: { instructorId },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(firstCallOnResponse.status()).toBe(200);

    // Verify Alice is active speaker
    let statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    let statusData = await statusResponse.json();
    expect(statusData.activeSpeaker.participantId).toBe(participants[0].participantId);

    // Try to call on second participant while Alice is still active
    const secondCallOnResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/call-on`, {
      data: { instructorId },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // This should either succeed (replacing Alice) or return an error
    // The exact behavior depends on implementation
    expect([200, 400, 409]).toContain(secondCallOnResponse.status());
  });

  test('should handle call on with non-instructor', async ({ request }) => {
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
    const callOnResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/call-on`, {
      data: { instructorId: participantData.participantId }, // Same as participant
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(callOnResponse.status()).toBe(403);
  });
});
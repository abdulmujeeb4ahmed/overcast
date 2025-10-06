import { test, expect } from '@playwright/test';

test.describe('Queue Participant Leaves Integration Flow', () => {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  const classroomId = '1';

  test('should handle participant leaving while in queue', async ({ request }) => {
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

    // Verify all participants are in queue
    let statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    let statusData = await statusResponse.json();
    expect(statusData.entries).toHaveLength(3);

    // Simulate Bob leaving by lowering his hand
    const lowerResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/lower-hand`, {
      data: { participantId: participants[1].participantId },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(lowerResponse.status()).toBe(200);

    // Verify Bob is removed from queue and positions are updated
    statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    statusData = await statusResponse.json();
    expect(statusData.entries).toHaveLength(2);
    
    // Verify remaining participants and their positions
    const remainingParticipantIds = statusData.entries.map((entry: any) => entry.participantId);
    expect(remainingParticipantIds).toContain(participants[0].participantId); // Alice
    expect(remainingParticipantIds).toContain(participants[2].participantId); // Charlie
    expect(remainingParticipantIds).not.toContain(participants[1].participantId); // Bob removed
    
    // Verify positions are updated correctly
    expect(statusData.entries[0].position).toBe(1);
    expect(statusData.entries[1].position).toBe(2);
  });

  test('should handle participant leaving while active speaker', async ({ request }) => {
    const participantData = {
      participantId: '550e8400-e29b-41d4-a716-446655440000',
      participantName: 'John Doe'
    };

    const instructorId = '550e8400-e29b-41d4-a716-446655440010';

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
      data: { instructorId },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(callOnResponse.status()).toBe(200);

    // Verify participant is active speaker
    let statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    let statusData = await statusResponse.json();
    expect(statusData.activeSpeaker.participantId).toBe(participantData.participantId);

    // Simulate participant leaving by lowering their hand
    const lowerResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/lower-hand`, {
      data: { participantId: participantData.participantId },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(lowerResponse.status()).toBe(200);

    // Verify participant is no longer active speaker
    statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    statusData = await statusResponse.json();
    expect(statusData.activeSpeaker).toBeNull();
    expect(statusData.entries).toHaveLength(0);
  });

  test('should handle participant leaving from middle of queue', async ({ request }) => {
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
      },
      {
        participantId: '550e8400-e29b-41d4-a716-446655440004',
        participantName: 'David'
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

    // Verify all participants are in queue
    let statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    let statusData = await statusResponse.json();
    expect(statusData.entries).toHaveLength(4);

    // Simulate Bob (position 2) leaving
    const lowerResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/lower-hand`, {
      data: { participantId: participants[1].participantId },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(lowerResponse.status()).toBe(200);

    // Verify Bob is removed and positions are updated
    statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    statusData = await statusResponse.json();
    expect(statusData.entries).toHaveLength(3);
    
    // Verify remaining participants and their updated positions
    const remainingParticipantIds = statusData.entries.map((entry: any) => entry.participantId);
    expect(remainingParticipantIds).toContain(participants[0].participantId); // Alice
    expect(remainingParticipantIds).toContain(participants[2].participantId); // Charlie
    expect(remainingParticipantIds).toContain(participants[3].participantId); // David
    expect(remainingParticipantIds).not.toContain(participants[1].participantId); // Bob removed
    
    // Verify positions are updated correctly
    expect(statusData.entries[0].position).toBe(1); // Alice
    expect(statusData.entries[1].position).toBe(2); // Charlie (moved up)
    expect(statusData.entries[2].position).toBe(3); // David (moved up)
  });

  test('should handle participant leaving when they are not in queue', async ({ request }) => {
    const participantId = '550e8400-e29b-41d4-a716-446655440000';

    // Try to lower hand for participant not in queue
    const lowerResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/lower-hand`, {
      data: { participantId },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(lowerResponse.status()).toBe(404);
  });

  test('should handle multiple participants leaving simultaneously', async ({ request }) => {
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
      },
      {
        participantId: '550e8400-e29b-41d4-a716-446655440004',
        participantName: 'David'
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

    // Verify all participants are in queue
    let statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    let statusData = await statusResponse.json();
    expect(statusData.entries).toHaveLength(4);

    // Simulate Bob and David leaving simultaneously
    const lowerBobResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/lower-hand`, {
      data: { participantId: participants[1].participantId },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(lowerBobResponse.status()).toBe(200);

    const lowerDavidResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/lower-hand`, {
      data: { participantId: participants[3].participantId },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(lowerDavidResponse.status()).toBe(200);

    // Verify Bob and David are removed and positions are updated
    statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    statusData = await statusResponse.json();
    expect(statusData.entries).toHaveLength(2);
    
    // Verify remaining participants and their updated positions
    const remainingParticipantIds = statusData.entries.map((entry: any) => entry.participantId);
    expect(remainingParticipantIds).toContain(participants[0].participantId); // Alice
    expect(remainingParticipantIds).toContain(participants[2].participantId); // Charlie
    expect(remainingParticipantIds).not.toContain(participants[1].participantId); // Bob removed
    expect(remainingParticipantIds).not.toContain(participants[3].participantId); // David removed
    
    // Verify positions are updated correctly
    expect(statusData.entries[0].position).toBe(1); // Alice
    expect(statusData.entries[1].position).toBe(2); // Charlie
  });

  test('should handle participant leaving with invalid data', async ({ request }) => {
    // Test with missing participantId
    const lowerResponse1 = await request.post(`${baseUrl}/api/queue/${classroomId}/lower-hand`, {
      data: {},
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(lowerResponse1.status()).toBe(400);

    // Test with invalid participantId format
    const lowerResponse2 = await request.post(`${baseUrl}/api/queue/${classroomId}/lower-hand`, {
      data: { participantId: 'invalid-uuid' },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(lowerResponse2.status()).toBe(400);
  });

  test('should handle participant leaving with invalid classroom ID', async ({ request }) => {
    const participantId = '550e8400-e29b-41d4-a716-446655440000';

    // Test with invalid classroom ID format
    const invalidEndpoint1 = '/api/queue/invalid/lower-hand';
    const response1 = await request.post(`${baseUrl}${invalidEndpoint1}`, {
      data: { participantId },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(response1.status()).toBe(400);

    // Test with classroom ID outside range
    const invalidEndpoint2 = '/api/queue/7/lower-hand';
    const response2 = await request.post(`${baseUrl}${invalidEndpoint2}`, {
      data: { participantId },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(response2.status()).toBe(400);
  });
});
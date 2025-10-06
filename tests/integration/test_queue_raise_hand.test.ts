import { test, expect } from '@playwright/test';

test.describe('Queue Raise Hand Integration Flow', () => {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  const classroomId = '1';

  test('should complete full raise hand flow', async ({ request }) => {
    const participantData = {
      participantId: '550e8400-e29b-41d4-a716-446655440000',
      participantName: 'John Doe'
    };

    // Step 1: Check initial queue status (should be empty)
    let statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    let statusData = await statusResponse.json();
    expect(statusData.entries).toHaveLength(0);
    expect(statusData.activeSpeaker).toBeNull();

    // Step 2: Raise hand
    const raiseResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/raise-hand`, {
      data: participantData,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(raiseResponse.status()).toBe(200);
    
    const raiseData = await raiseResponse.json();
    expect(raiseData.success).toBe(true);
    expect(raiseData.position).toBe(1);
    expect(raiseData.queueEntry.participantId).toBe(participantData.participantId);

    // Step 3: Verify queue status shows participant
    statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    statusData = await statusResponse.json();
    expect(statusData.entries).toHaveLength(1);
    expect(statusData.entries[0].participantId).toBe(participantData.participantId);
    expect(statusData.entries[0].position).toBe(1);
    expect(statusData.entries[0].isActive).toBe(false);

    // Step 4: Try to raise hand again (should fail)
    const duplicateRaiseResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/raise-hand`, {
      data: participantData,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(duplicateRaiseResponse.status()).toBe(400);

    // Step 5: Lower hand
    const lowerResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/lower-hand`, {
      data: { participantId: participantData.participantId },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(lowerResponse.status()).toBe(200);

    // Step 6: Verify queue is empty again
    statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    statusData = await statusResponse.json();
    expect(statusData.entries).toHaveLength(0);
    expect(statusData.activeSpeaker).toBeNull();
  });

  test('should handle multiple participants raising hands in order', async ({ request }) => {
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
    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i];
      const raiseResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/raise-hand`, {
        data: participant,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      expect(raiseResponse.status()).toBe(200);
      
      const raiseData = await raiseResponse.json();
      expect(raiseData.position).toBe(i + 1);
    }

    // Verify queue order
    const statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    const statusData = await statusResponse.json();
    expect(statusData.entries).toHaveLength(3);
    
    // Verify positions are correct
    for (let i = 0; i < statusData.entries.length; i++) {
      expect(statusData.entries[i].position).toBe(i + 1);
      expect(statusData.entries[i].participantId).toBe(participants[i].participantId);
    }
  });

  test('should handle raise hand with capacity limits', async ({ request }) => {
    // Add participants up to capacity (assuming 50)
    const participants = [];
    for (let i = 0; i < 50; i++) {
      participants.push({
        participantId: `550e8400-e29b-41d4-a716-44665544${i.toString().padStart(4, '0')}`,
        participantName: `Participant ${i + 1}`
      });
    }

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

    // Verify queue is at capacity
    let statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    let statusData = await statusResponse.json();
    expect(statusData.entries).toHaveLength(50);

    // Try to add one more participant (should fail)
    const overflowParticipant = {
      participantId: '550e8400-e29b-41d4-a716-446655445000',
      participantName: 'Overflow Participant'
    };

    const overflowResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/raise-hand`, {
      data: overflowParticipant,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(overflowResponse.status()).toBe(409);

    // Verify queue is still at capacity
    statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    statusData = await statusResponse.json();
    expect(statusData.entries).toHaveLength(50);
  });

  test('should handle raise hand with invalid data', async ({ request }) => {
    // Test with missing participantId
    const invalidData1 = {
      participantName: 'John Doe'
    };

    const response1 = await request.post(`${baseUrl}/api/queue/${classroomId}/raise-hand`, {
      data: invalidData1,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(response1.status()).toBe(400);

    // Test with missing participantName
    const invalidData2 = {
      participantId: '550e8400-e29b-41d4-a716-446655440000'
    };

    const response2 = await request.post(`${baseUrl}/api/queue/${classroomId}/raise-hand`, {
      data: invalidData2,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(response2.status()).toBe(400);

    // Test with invalid participantId format
    const invalidData3 = {
      participantId: 'invalid-uuid',
      participantName: 'John Doe'
    };

    const response3 = await request.post(`${baseUrl}/api/queue/${classroomId}/raise-hand`, {
      data: invalidData3,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(response3.status()).toBe(400);

    // Test with empty participantName
    const invalidData4 = {
      participantId: '550e8400-e29b-41d4-a716-446655440000',
      participantName: ''
    };

    const response4 = await request.post(`${baseUrl}/api/queue/${classroomId}/raise-hand`, {
      data: invalidData4,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(response4.status()).toBe(400);

    // Test with participantName too long
    const invalidData5 = {
      participantId: '550e8400-e29b-41d4-a716-446655440000',
      participantName: 'A'.repeat(51)
    };

    const response5 = await request.post(`${baseUrl}/api/queue/${classroomId}/raise-hand`, {
      data: invalidData5,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(response5.status()).toBe(400);
  });

  test('should handle raise hand with invalid classroom ID', async ({ request }) => {
    const participantData = {
      participantId: '550e8400-e29b-41d4-a716-446655440000',
      participantName: 'John Doe'
    };

    // Test with invalid classroom ID format
    const invalidEndpoint1 = '/api/queue/invalid/raise-hand';
    const response1 = await request.post(`${baseUrl}${invalidEndpoint1}`, {
      data: participantData,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(response1.status()).toBe(400);

    // Test with classroom ID outside range
    const invalidEndpoint2 = '/api/queue/7/raise-hand';
    const response2 = await request.post(`${baseUrl}${invalidEndpoint2}`, {
      data: participantData,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(response2.status()).toBe(400);
  });
});
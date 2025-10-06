import { test, expect } from '@playwright/test';

test.describe('Queue Capacity Integration Flow', () => {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  const classroomId = '1';

  test('should handle queue at capacity', async ({ request }) => {
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
    expect(statusData.maxCapacity).toBe(50);

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

  test('should handle queue capacity after participant leaves', async ({ request }) => {
    // Add participants up to capacity
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

    // Remove one participant
    const lowerResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/lower-hand`, {
      data: { participantId: participants[0].participantId },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(lowerResponse.status()).toBe(200);

    // Verify queue has space for one more
    statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    statusData = await statusResponse.json();
    expect(statusData.entries).toHaveLength(49);

    // Add one more participant (should succeed)
    const newParticipant = {
      participantId: '550e8400-e29b-41d4-a716-446655445000',
      participantName: 'New Participant'
    };

    const raiseResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/raise-hand`, {
      data: newParticipant,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(raiseResponse.status()).toBe(200);

    // Verify queue is at capacity again
    statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    statusData = await statusResponse.json();
    expect(statusData.entries).toHaveLength(50);
  });

  test('should handle queue capacity with call on operations', async ({ request }) => {
    const instructorId = '550e8400-e29b-41d4-a716-446655440010';

    // Add participants up to capacity
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

    // Call on first participant
    const callOnResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/call-on`, {
      data: { instructorId },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(callOnResponse.status()).toBe(200);

    // Verify participant is active speaker and removed from queue
    statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    statusData = await statusResponse.json();
    expect(statusData.activeSpeaker).not.toBeNull();
    expect(statusData.entries).toHaveLength(49);

    // Now we should be able to add one more participant
    const newParticipant = {
      participantId: '550e8400-e29b-41d4-a716-446655445000',
      participantName: 'New Participant'
    };

    const raiseResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/raise-hand`, {
      data: newParticipant,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(raiseResponse.status()).toBe(200);

    // Verify queue is at capacity again
    statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    statusData = await statusResponse.json();
    expect(statusData.entries).toHaveLength(50);
  });

  test('should handle queue capacity with lower all operations', async ({ request }) => {
    const instructorId = '550e8400-e29b-41d4-a716-446655440010';

    // Add participants up to capacity
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

    // Lower all hands
    const lowerAllResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/lower-all`, {
      data: { instructorId },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(lowerAllResponse.status()).toBe(200);
    
    const lowerAllData = await lowerAllResponse.json();
    expect(lowerAllData.loweredCount).toBe(50);

    // Verify queue is empty
    statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    statusData = await statusResponse.json();
    expect(statusData.entries).toHaveLength(0);

    // Now we should be able to add participants again
    const newParticipants = [
      {
        participantId: '550e8400-e29b-41d4-a716-446655445001',
        participantName: 'New Participant 1'
      },
      {
        participantId: '550e8400-e29b-41d4-a716-446655445002',
        participantName: 'New Participant 2'
      }
    ];

    for (const participant of newParticipants) {
      const raiseResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/raise-hand`, {
        data: participant,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      expect(raiseResponse.status()).toBe(200);
    }

    // Verify new participants are in queue
    statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    statusData = await statusResponse.json();
    expect(statusData.entries).toHaveLength(2);
  });

  test('should handle queue capacity with mixed operations', async ({ request }) => {
    const instructorId = '550e8400-e29b-41d4-a716-446655440010';

    // Add participants up to capacity
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

    // Call on first participant
    const callOnResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/call-on`, {
      data: { instructorId },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(callOnResponse.status()).toBe(200);

    // Lower individual participant (second in queue)
    const lowerIndividualResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/lower-individual`, {
      data: {
        instructorId,
        participantId: participants[1].participantId
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(lowerIndividualResponse.status()).toBe(200);

    // Verify queue has space for 2 more participants
    statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    statusData = await statusResponse.json();
    expect(statusData.entries).toHaveLength(48);

    // Add 2 new participants
    const newParticipants = [
      {
        participantId: '550e8400-e29b-41d4-a716-446655445001',
        participantName: 'New Participant 1'
      },
      {
        participantId: '550e8400-e29b-41d4-a716-446655445002',
        participantName: 'New Participant 2'
      }
    ];

    for (const participant of newParticipants) {
      const raiseResponse = await request.post(`${baseUrl}/api/queue/${classroomId}/raise-hand`, {
        data: participant,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      expect(raiseResponse.status()).toBe(200);
    }

    // Verify queue is at capacity again
    statusResponse = await request.get(`${baseUrl}/api/queue/${classroomId}/status`);
    expect(statusResponse.status()).toBe(200);
    
    statusData = await statusResponse.json();
    expect(statusData.entries).toHaveLength(50);
  });
});
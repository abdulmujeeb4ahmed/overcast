/**
 * Unit Test: Queue Utils
 * 
 * Tests utility functions for queue management
 * Validates QueueEntry creation, validation, and helper functions
 */

import {
  createQueueEntry,
  validateQueueEntry,
  createEmptyQueueState,
  validateQueueState,
  createActiveSpeaker,
  validateActiveSpeaker,
  isParticipantInQueue,
  isQueueAtCapacity,
  getNextQueuePosition,
  findQueueEntry,
  updateQueuePositions
} from '@/lib/queue-utils';
import { QueueEntry, QueueState, ActiveSpeaker } from '@/lib/queue-types';

// Mock crypto.randomUUID for consistent testing
const mockUUID = 'test-uuid-12345';
jest.spyOn(crypto, 'randomUUID').mockReturnValue(mockUUID);

describe('Queue Utils', () => {
  describe('createQueueEntry', () => {
    test('creates a valid queue entry with all required fields', () => {
      const entry = createQueueEntry(
        'participant-123',
        'John Doe',
        '1',
        'student'
      );

      expect(entry).toEqual({
        id: mockUUID,
        participantId: 'participant-123',
        participantName: 'John Doe',
        classroomId: '1',
        raisedAt: expect.any(Date),
        position: 1,
        isActive: false,
        role: 'student'
      });
    });

    test('creates queue entry for instructor role', () => {
      const entry = createQueueEntry(
        'instructor-456',
        'Dr. Smith',
        '2',
        'instructor'
      );

      expect(entry.role).toBe('instructor');
      expect(entry.participantName).toBe('Dr. Smith');
    });

    test('sets raisedAt to current date', () => {
      const before = new Date();
      const entry = createQueueEntry('participant-123', 'John Doe', '1', 'student');
      const after = new Date();

      expect(entry.raisedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(entry.raisedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('validateQueueEntry', () => {
    test('validates a correct queue entry', () => {
      const entry: QueueEntry = {
        id: 'test-id',
        participantId: 'participant-123',
        participantName: 'John Doe',
        classroomId: '1',
        raisedAt: new Date(),
        position: 1,
        isActive: false,
        role: 'student'
      };

      expect(validateQueueEntry(entry)).toBe(true);
    });

    test('rejects entry with missing id', () => {
      const entry = {
        id: '',
        participantId: 'participant-123',
        participantName: 'John Doe',
        classroomId: '1',
        raisedAt: new Date(),
        position: 1,
        isActive: false,
        role: 'student'
      } as QueueEntry;

      expect(validateQueueEntry(entry)).toBe(false);
    });

    test('rejects entry with missing participantId', () => {
      const entry = {
        id: 'test-id',
        participantId: '',
        participantName: 'John Doe',
        classroomId: '1',
        raisedAt: new Date(),
        position: 1,
        isActive: false,
        role: 'student'
      } as QueueEntry;

      expect(validateQueueEntry(entry)).toBe(false);
    });

    test('rejects entry with missing participantName', () => {
      const entry = {
        id: 'test-id',
        participantId: 'participant-123',
        participantName: '',
        classroomId: '1',
        raisedAt: new Date(),
        position: 1,
        isActive: false,
        role: 'student'
      } as QueueEntry;

      expect(validateQueueEntry(entry)).toBe(false);
    });

    test('rejects entry with missing classroomId', () => {
      const entry = {
        id: 'test-id',
        participantId: 'participant-123',
        participantName: 'John Doe',
        classroomId: '',
        raisedAt: new Date(),
        position: 1,
        isActive: false,
        role: 'student'
      } as QueueEntry;

      expect(validateQueueEntry(entry)).toBe(false);
    });

    test('rejects entry with invalid raisedAt', () => {
      const entry = {
        id: 'test-id',
        participantId: 'participant-123',
        participantName: 'John Doe',
        classroomId: '1',
        raisedAt: 'invalid-date' as any,
        position: 1,
        isActive: false,
        role: 'student'
      } as QueueEntry;

      expect(validateQueueEntry(entry)).toBe(false);
    });

    test('rejects entry with invalid position', () => {
      const entry = {
        id: 'test-id',
        participantId: 'participant-123',
        participantName: 'John Doe',
        classroomId: '1',
        raisedAt: new Date(),
        position: 0,
        isActive: false,
        role: 'student'
      } as QueueEntry;

      expect(validateQueueEntry(entry)).toBe(false);
    });

    test('rejects entry with invalid isActive type', () => {
      const entry = {
        id: 'test-id',
        participantId: 'participant-123',
        participantName: 'John Doe',
        classroomId: '1',
        raisedAt: new Date(),
        position: 1,
        isActive: 'true' as any,
        role: 'student'
      } as QueueEntry;

      expect(validateQueueEntry(entry)).toBe(false);
    });

    test('rejects entry with invalid role', () => {
      const entry = {
        id: 'test-id',
        participantId: 'participant-123',
        participantName: 'John Doe',
        classroomId: '1',
        raisedAt: new Date(),
        position: 1,
        isActive: false,
        role: 'invalid-role' as any
      } as QueueEntry;

      expect(validateQueueEntry(entry)).toBe(false);
    });

    test('accepts valid instructor role', () => {
      const entry: QueueEntry = {
        id: 'test-id',
        participantId: 'instructor-456',
        participantName: 'Dr. Smith',
        classroomId: '1',
        raisedAt: new Date(),
        position: 1,
        isActive: false,
        role: 'instructor'
      };

      expect(validateQueueEntry(entry)).toBe(true);
    });
  });

  describe('createEmptyQueueState', () => {
    test('creates an empty queue state with default values', () => {
      const state = createEmptyQueueState('1');

      expect(state).toEqual({
        classroomId: '1',
        entries: [],
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: expect.any(Date),
        isActive: true
      });
    });

    test('sets lastUpdated to current date', () => {
      const before = new Date();
      const state = createEmptyQueueState('2');
      const after = new Date();

      expect(state.lastUpdated.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(state.lastUpdated.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('validateQueueState', () => {
    test('validates a correct queue state', () => {
      const state: QueueState = {
        classroomId: '1',
        entries: [
          {
            id: 'entry-1',
            participantId: 'participant-123',
            participantName: 'John Doe',
            classroomId: '1',
            raisedAt: new Date(),
            position: 1,
            isActive: false,
            role: 'student'
          }
        ],
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: new Date(),
        isActive: true
      };

      expect(validateQueueState(state)).toBe(true);
    });

    test('rejects state with missing classroomId', () => {
      const state = {
        classroomId: '',
        entries: [],
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: new Date(),
        isActive: true
      } as QueueState;

      expect(validateQueueState(state)).toBe(false);
    });

    test('rejects state with invalid entries array', () => {
      const state = {
        classroomId: '1',
        entries: 'not-an-array' as any,
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: new Date(),
        isActive: true
      } as QueueState;

      expect(validateQueueState(state)).toBe(false);
    });

    test('rejects state with invalid maxCapacity', () => {
      const state = {
        classroomId: '1',
        entries: [],
        activeSpeaker: null,
        maxCapacity: 0,
        lastUpdated: new Date(),
        isActive: true
      } as QueueState;

      expect(validateQueueState(state)).toBe(false);
    });

    test('rejects state with maxCapacity exceeding 50', () => {
      const state = {
        classroomId: '1',
        entries: [],
        activeSpeaker: null,
        maxCapacity: 51,
        lastUpdated: new Date(),
        isActive: true
      } as QueueState;

      expect(validateQueueState(state)).toBe(false);
    });

    test('rejects state with invalid lastUpdated', () => {
      const state = {
        classroomId: '1',
        entries: [],
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: 'invalid-date' as any,
        isActive: true
      } as QueueState;

      expect(validateQueueState(state)).toBe(false);
    });

    test('rejects state with invalid isActive type', () => {
      const state = {
        classroomId: '1',
        entries: [],
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: new Date(),
        isActive: 'true' as any
      } as QueueState;

      expect(validateQueueState(state)).toBe(false);
    });

    test('rejects state with invalid entries', () => {
      const state = {
        classroomId: '1',
        entries: [
          {
            id: '', // Invalid entry
            participantId: 'participant-123',
            participantName: 'John Doe',
            classroomId: '1',
            raisedAt: new Date(),
            position: 1,
            isActive: false,
            role: 'student'
          }
        ],
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: new Date(),
        isActive: true
      } as QueueState;

      expect(validateQueueState(state)).toBe(false);
    });
  });

  describe('createActiveSpeaker', () => {
    test('creates a valid active speaker record', () => {
      const speaker = createActiveSpeaker(
        'participant-123',
        'John Doe',
        '1',
        'student'
      );

      expect(speaker).toEqual({
        participantId: 'participant-123',
        participantName: 'John Doe',
        classroomId: '1',
        calledAt: expect.any(Date),
        role: 'student'
      });
    });

    test('sets calledAt to current date', () => {
      const before = new Date();
      const speaker = createActiveSpeaker('participant-123', 'John Doe', '1', 'student');
      const after = new Date();

      expect(speaker.calledAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(speaker.calledAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('validateActiveSpeaker', () => {
    test('validates a correct active speaker record', () => {
      const speaker: ActiveSpeaker = {
        participantId: 'participant-123',
        participantName: 'John Doe',
        classroomId: '1',
        calledAt: new Date(),
        role: 'student'
      };

      expect(validateActiveSpeaker(speaker)).toBe(true);
    });

    test('rejects speaker with missing participantId', () => {
      const speaker = {
        participantId: '',
        participantName: 'John Doe',
        classroomId: '1',
        calledAt: new Date(),
        role: 'student'
      } as ActiveSpeaker;

      expect(validateActiveSpeaker(speaker)).toBe(false);
    });

    test('rejects speaker with invalid role', () => {
      const speaker = {
        participantId: 'participant-123',
        participantName: 'John Doe',
        classroomId: '1',
        calledAt: new Date(),
        role: 'invalid-role' as any
      } as ActiveSpeaker;

      expect(validateActiveSpeaker(speaker)).toBe(false);
    });
  });

  describe('isParticipantInQueue', () => {
    test('returns true when participant is in queue', () => {
      const state: QueueState = {
        classroomId: '1',
        entries: [
          {
            id: 'entry-1',
            participantId: 'participant-123',
            participantName: 'John Doe',
            classroomId: '1',
            raisedAt: new Date(),
            position: 1,
            isActive: false,
            role: 'student'
          }
        ],
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: new Date(),
        isActive: true
      };

      expect(isParticipantInQueue(state, 'participant-123')).toBe(true);
    });

    test('returns false when participant is not in queue', () => {
      const state: QueueState = {
        classroomId: '1',
        entries: [
          {
            id: 'entry-1',
            participantId: 'participant-456',
            participantName: 'Jane Doe',
            classroomId: '1',
            raisedAt: new Date(),
            position: 1,
            isActive: false,
            role: 'student'
          }
        ],
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: new Date(),
        isActive: true
      };

      expect(isParticipantInQueue(state, 'participant-123')).toBe(false);
    });

    test('returns false when queue is empty', () => {
      const state = createEmptyQueueState('1');
      expect(isParticipantInQueue(state, 'participant-123')).toBe(false);
    });
  });

  describe('isQueueAtCapacity', () => {
    test('returns false when queue is not at capacity', () => {
      const state = createEmptyQueueState('1');
      expect(isQueueAtCapacity(state)).toBe(false);
    });

    test('returns true when queue is at capacity', () => {
      const state: QueueState = {
        classroomId: '1',
        entries: Array.from({ length: 50 }, (_, i) => ({
          id: `entry-${i}`,
          participantId: `participant-${i}`,
          participantName: `Participant ${i}`,
          classroomId: '1',
          raisedAt: new Date(),
          position: i + 1,
          isActive: false,
          role: 'student' as const
        })),
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: new Date(),
        isActive: true
      };

      expect(isQueueAtCapacity(state)).toBe(true);
    });

    test('returns false when queue has fewer entries than capacity', () => {
      const state: QueueState = {
        classroomId: '1',
        entries: Array.from({ length: 25 }, (_, i) => ({
          id: `entry-${i}`,
          participantId: `participant-${i}`,
          participantName: `Participant ${i}`,
          classroomId: '1',
          raisedAt: new Date(),
          position: i + 1,
          isActive: false,
          role: 'student' as const
        })),
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: new Date(),
        isActive: true
      };

      expect(isQueueAtCapacity(state)).toBe(false);
    });
  });

  describe('getNextQueuePosition', () => {
    test('returns 1 for empty queue', () => {
      const state = createEmptyQueueState('1');
      expect(getNextQueuePosition(state)).toBe(1);
    });

    test('returns correct position for queue with entries', () => {
      const state: QueueState = {
        classroomId: '1',
        entries: Array.from({ length: 3 }, (_, i) => ({
          id: `entry-${i}`,
          participantId: `participant-${i}`,
          participantName: `Participant ${i}`,
          classroomId: '1',
          raisedAt: new Date(),
          position: i + 1,
          isActive: false,
          role: 'student' as const
        })),
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: new Date(),
        isActive: true
      };

      expect(getNextQueuePosition(state)).toBe(4);
    });
  });

  describe('findQueueEntry', () => {
    test('finds existing queue entry', () => {
      const targetEntry = {
        id: 'entry-2',
        participantId: 'participant-456',
        participantName: 'Jane Doe',
        classroomId: '1',
        raisedAt: new Date(),
        position: 2,
        isActive: false,
        role: 'student' as const
      };

      const state: QueueState = {
        classroomId: '1',
        entries: [
          {
            id: 'entry-1',
            participantId: 'participant-123',
            participantName: 'John Doe',
            classroomId: '1',
            raisedAt: new Date(),
            position: 1,
            isActive: false,
            role: 'student' as const
          },
          targetEntry
        ],
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: new Date(),
        isActive: true
      };

      const found = findQueueEntry(state, 'participant-456');
      expect(found).toEqual(targetEntry);
    });

    test('returns undefined for non-existent participant', () => {
      const state = createEmptyQueueState('1');
      const found = findQueueEntry(state, 'non-existent');
      expect(found).toBeUndefined();
    });
  });

  describe('updateQueuePositions', () => {
    test('sorts entries by raisedAt and updates positions', () => {
      const now = new Date();
      const entry1 = {
        id: 'entry-1',
        participantId: 'participant-1',
        participantName: 'First',
        classroomId: '1',
        raisedAt: new Date(now.getTime() + 1000), // Later
        position: 3,
        isActive: false,
        role: 'student' as const
      };

      const entry2 = {
        id: 'entry-2',
        participantId: 'participant-2',
        participantName: 'Second',
        classroomId: '1',
        raisedAt: now, // Earlier
        position: 1,
        isActive: false,
        role: 'student' as const
      };

      const entries = [entry1, entry2];
      const updated = updateQueuePositions(entries);

      expect(updated).toHaveLength(2);
      expect(updated[0]).toEqual({ ...entry2, position: 1 }); // Earlier time first
      expect(updated[1]).toEqual({ ...entry1, position: 2 }); // Later time second
    });

    test('handles empty array', () => {
      const updated = updateQueuePositions([]);
      expect(updated).toEqual([]);
    });

    test('handles single entry', () => {
      const entry = {
        id: 'entry-1',
        participantId: 'participant-1',
        participantName: 'Single',
        classroomId: '1',
        raisedAt: new Date(),
        position: 5,
        isActive: false,
        role: 'student' as const
      };

      const updated = updateQueuePositions([entry]);
      expect(updated).toEqual([{ ...entry, position: 1 }]);
    });
  });
});

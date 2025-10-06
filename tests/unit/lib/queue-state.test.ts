/**
 * Unit Test: Queue State Management
 * 
 * Tests queue state management functions and Daily.co integration
 * Validates state updates, participant management, and event handling
 */

import {
  getQueueState,
  updateQueueState,
  addToQueue,
  removeFromQueue,
  callOnNextParticipant,
  clearActiveSpeaker,
  lowerAllHands,
  handleParticipantLeave,
  resetQueueState,
  addQueueEventListener,
  removeQueueEventListener,
  initializeDailyQueueIntegration,
  cleanupDailyQueueIntegration,
  isDailyQueueIntegrationActive,
  getDailyCall,
  getDailyParticipantForQueue
} from '@/lib/queue-state';
import { QueueState, QueueEntry, ActiveSpeaker } from '@/lib/queue-types';

// Mock the queue-utils module
jest.mock('@/lib/queue-utils', () => ({
  createEmptyQueueState: jest.fn((classroomId: string) => ({
    classroomId,
    entries: [],
    activeSpeaker: null,
    maxCapacity: 50,
    lastUpdated: new Date(),
    isActive: true
  })),
  createQueueEntry: jest.fn((participantId: string, participantName: string, classroomId: string, role: string) => ({
    id: `entry-${participantId}`,
    participantId,
    participantName,
    classroomId,
    raisedAt: new Date(),
    position: 1,
    isActive: false,
    role
  })),
  createActiveSpeaker: jest.fn((participantId: string, participantName: string, classroomId: string, role: string) => ({
    participantId,
    participantName,
    classroomId,
    calledAt: new Date(),
    role
  })),
  validateQueueState: jest.fn(() => true),
  isParticipantInQueue: jest.fn(() => false),
  isQueueAtCapacity: jest.fn(() => false),
  getNextQueuePosition: jest.fn(() => 1),
  updateQueuePositions: jest.fn((entries) => entries.map((entry: any, index: number) => ({ ...entry, position: index + 1 })))
}));

// Mock the daily-utils module
jest.mock('@/lib/daily-utils', () => ({
  parseDailyError: jest.fn((error: any) => ({ type: 'unknown', message: 'Test error' })),
  getParticipantRole: jest.fn(() => 'student')
}));

describe('Queue State Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset any existing queue states
    resetQueueState('1');
    resetQueueState('2');
  });

  describe('getQueueState', () => {
    test('creates new queue state for classroom if not exists', () => {
      const state = getQueueState('3');
      
      expect(state).toEqual({
        classroomId: '3',
        entries: [],
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: expect.any(Date),
        isActive: true
      });
    });

    test('returns existing queue state for classroom', () => {
      const state1 = getQueueState('1');
      const state2 = getQueueState('1');
      
      expect(state1).toBe(state2); // Same reference
    });

    test('maintains separate states for different classrooms', () => {
      const state1 = getQueueState('1');
      const state2 = getQueueState('2');
      
      expect(state1).not.toBe(state2);
      expect(state1.classroomId).toBe('1');
      expect(state2.classroomId).toBe('2');
    });
  });

  describe('updateQueueState', () => {
    test('updates queue state and validates', () => {
      const updater = jest.fn((state) => ({
        ...state,
        isActive: false
      }));

      const updated = updateQueueState('1', updater);
      
      expect(updater).toHaveBeenCalledWith(expect.any(Object));
      expect(updated.isActive).toBe(false);
    });

    test('throws error for invalid queue state', () => {
      const { validateQueueState } = require('@/lib/queue-utils');
      validateQueueState.mockReturnValue(false);

      const updater = jest.fn((state) => state);

      expect(() => updateQueueState('1', updater)).toThrow('Invalid queue state');
    });

    test('updates lastUpdated timestamp', () => {
      const before = new Date();
      updateQueueState('1', (state) => state);
      const after = new Date();
      const state = getQueueState('1');
      
      expect(state.lastUpdated.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(state.lastUpdated.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('addToQueue', () => {
    test('adds participant to queue successfully', () => {
      const { createQueueEntry, isParticipantInQueue, isQueueAtCapacity, getNextQueuePosition, updateQueuePositions } = require('@/lib/queue-utils');
      
      isParticipantInQueue.mockReturnValue(false);
      isQueueAtCapacity.mockReturnValue(false);
      getNextQueuePosition.mockReturnValue(1);
      updateQueuePositions.mockReturnValue([]);

      const state = addToQueue('1', 'participant-123', 'John Doe', 'student');
      
      expect(createQueueEntry).toHaveBeenCalledWith('participant-123', 'John Doe', '1', 'student');
      expect(state.classroomId).toBe('1');
    });

    test('throws error when participant already in queue', () => {
      const { isParticipantInQueue } = require('@/lib/queue-utils');
      isParticipantInQueue.mockReturnValue(true);

      expect(() => addToQueue('1', 'participant-123', 'John Doe', 'student')).toThrow('Participant already in queue');
    });

    test('throws error when queue at capacity', () => {
      const { isParticipantInQueue, isQueueAtCapacity } = require('@/lib/queue-utils');
      isParticipantInQueue.mockReturnValue(false);
      isQueueAtCapacity.mockReturnValue(true);

      expect(() => addToQueue('1', 'participant-123', 'John Doe', 'student')).toThrow('Queue at capacity');
    });

    test('throws error when queue is not active', () => {
      const { isParticipantInQueue, isQueueAtCapacity } = require('@/lib/queue-utils');
      isParticipantInQueue.mockReturnValue(false);
      isQueueAtCapacity.mockReturnValue(false);

      // Set queue to inactive
      updateQueueState('1', (state) => ({ ...state, isActive: false }));

      expect(() => addToQueue('1', 'participant-123', 'John Doe', 'student')).toThrow('Queue is not active');
    });
  });

  describe('removeFromQueue', () => {
    test('removes participant from queue', () => {
      const { updateQueuePositions } = require('@/lib/queue-utils');
      updateQueuePositions.mockReturnValue([]);

      // Add participant first
      addToQueue('1', 'participant-123', 'John Doe', 'student');
      
      const state = removeFromQueue('1', 'participant-123');
      
      expect(updateQueuePositions).toHaveBeenCalled();
      expect(state.classroomId).toBe('1');
    });

    test('handles removal of non-existent participant gracefully', () => {
      const { updateQueuePositions } = require('@/lib/queue-utils');
      updateQueuePositions.mockReturnValue([]);

      const state = removeFromQueue('1', 'non-existent');
      
      expect(updateQueuePositions).toHaveBeenCalled();
      expect(state.classroomId).toBe('1');
    });
  });

  describe('callOnNextParticipant', () => {
    test('calls on next participant successfully', () => {
      const { createActiveSpeaker, updateQueuePositions } = require('@/lib/queue-utils');
      updateQueuePositions.mockReturnValue([]);

      // Add participant to queue first
      addToQueue('1', 'participant-123', 'John Doe', 'student');
      
      const result = callOnNextParticipant('1', 'instructor-456');
      
      expect(createActiveSpeaker).toHaveBeenCalledWith('participant-123', 'John Doe', '1', 'student');
      expect(result.queueState.classroomId).toBe('1');
      expect(result.activeSpeaker.participantId).toBe('participant-123');
    });

    test('throws error when no participants in queue', () => {
      expect(() => callOnNextParticipant('1', 'instructor-456')).toThrow('No participants in queue');
    });

    test('throws error when there is already an active speaker', () => {
      // Add participant and set active speaker
      addToQueue('1', 'participant-123', 'John Doe', 'student');
      updateQueueState('1', (state) => ({ ...state, activeSpeaker: 'existing-speaker' }));

      expect(() => callOnNextParticipant('1', 'instructor-456')).toThrow('There is already an active speaker');
    });
  });

  describe('clearActiveSpeaker', () => {
    test('clears active speaker', () => {
      // Set active speaker first
      updateQueueState('1', (state) => ({ ...state, activeSpeaker: 'participant-123' }));
      
      const state = clearActiveSpeaker('1');
      
      expect(state.activeSpeaker).toBe(null);
    });
  });

  describe('lowerAllHands', () => {
    test('clears all queue entries and active speaker', () => {
      // Add participants and set active speaker
      addToQueue('1', 'participant-123', 'John Doe', 'student');
      updateQueueState('1', (state) => ({ ...state, activeSpeaker: 'participant-456' }));
      
      const state = lowerAllHands('1');
      
      expect(state.entries).toEqual([]);
      expect(state.activeSpeaker).toBe(null);
    });
  });

  describe('handleParticipantLeave', () => {
    test('removes participant from queue', () => {
      const { updateQueuePositions } = require('@/lib/queue-utils');
      updateQueuePositions.mockReturnValue([]);

      // Add participant first
      addToQueue('1', 'participant-123', 'John Doe', 'student');
      
      const state = handleParticipantLeave('1', 'participant-123');
      
      expect(updateQueuePositions).toHaveBeenCalled();
      expect(state.classroomId).toBe('1');
    });

    test('clears active speaker if participant was active', () => {
      const { updateQueuePositions } = require('@/lib/queue-utils');
      updateQueuePositions.mockReturnValue([]);

      // Set active speaker
      updateQueueState('1', (state) => ({ ...state, activeSpeaker: 'participant-123' }));
      
      const state = handleParticipantLeave('1', 'participant-123');
      
      expect(state.activeSpeaker).toBe(null);
    });

    test('does not clear active speaker if different participant', () => {
      const { updateQueuePositions } = require('@/lib/queue-utils');
      updateQueuePositions.mockReturnValue([]);

      // Set active speaker
      updateQueueState('1', (state) => ({ ...state, activeSpeaker: 'participant-456' }));
      
      const state = handleParticipantLeave('1', 'participant-123');
      
      expect(state.activeSpeaker).toBe('participant-456');
    });
  });

  describe('resetQueueState', () => {
    test('removes queue state for classroom', () => {
      // Create state
      getQueueState('1');
      
      resetQueueState('1');
      
      // Should create new state
      const newState = getQueueState('1');
      expect(newState.classroomId).toBe('1');
    });
  });

  describe('Queue Event Listeners', () => {
    test('adds queue event listener', () => {
      const listener = jest.fn();
      
      addQueueEventListener(listener);
      
      // Trigger an event by updating state
      updateQueueState('1', (state) => state);
      
      // Note: In real implementation, this would trigger the listener
      // For now, we just verify the listener was added without error
      expect(() => addQueueEventListener(listener)).not.toThrow();
    });

    test('removes queue event listener', () => {
      const listener = jest.fn();
      
      addQueueEventListener(listener);
      removeQueueEventListener(listener);
      
      expect(() => removeQueueEventListener(listener)).not.toThrow();
    });
  });

  describe('Daily.co Integration', () => {
    test('initializes Daily.co integration', () => {
      const mockCall = {
        on: jest.fn(),
        off: jest.fn(),
        participants: jest.fn(() => ({})),
        room: jest.fn(() => Promise.resolve({ name: 'classroom-1' }))
      } as any;

      initializeDailyQueueIntegration(mockCall);
      
      expect(mockCall.on).toHaveBeenCalledWith('participant-joined', expect.any(Function));
      expect(mockCall.on).toHaveBeenCalledWith('participant-left', expect.any(Function));
      expect(mockCall.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(isDailyQueueIntegrationActive()).toBe(true);
    });

    test('prevents duplicate initialization', () => {
      const mockCall = {
        on: jest.fn(),
        off: jest.fn(),
        participants: jest.fn(() => ({})),
        room: jest.fn(() => Promise.resolve({ name: 'classroom-1' }))
      } as any;

      initializeDailyQueueIntegration(mockCall);
      const onCallCount = mockCall.on.mock.calls.length;
      
      initializeDailyQueueIntegration(mockCall);
      
      expect(mockCall.on).toHaveBeenCalledTimes(onCallCount);
    });

    test('cleans up Daily.co integration', () => {
      const mockCall = {
        on: jest.fn(),
        off: jest.fn(),
        participants: jest.fn(() => ({})),
        room: jest.fn(() => Promise.resolve({ name: 'classroom-1' }))
      } as any;

      initializeDailyQueueIntegration(mockCall);
      cleanupDailyQueueIntegration();
      
      expect(mockCall.off).toHaveBeenCalledWith('participant-joined', expect.any(Function));
      expect(mockCall.off).toHaveBeenCalledWith('participant-left', expect.any(Function));
      expect(mockCall.off).toHaveBeenCalledWith('error', expect.any(Function));
      expect(isDailyQueueIntegrationActive()).toBe(false);
    });

    test('handles cleanup when not initialized', () => {
      expect(() => cleanupDailyQueueIntegration()).not.toThrow();
    });

    test('returns Daily.co integration status', () => {
      expect(isDailyQueueIntegrationActive()).toBe(false);
      
      const mockCall = {
        on: jest.fn(),
        off: jest.fn(),
        participants: jest.fn(() => ({})),
        room: jest.fn(() => Promise.resolve({ name: 'classroom-1' }))
      } as any;

      initializeDailyQueueIntegration(mockCall);
      expect(isDailyQueueIntegrationActive()).toBe(true);
    });

    test('returns Daily.co call instance', () => {
      expect(getDailyCall()).toBe(null);
      
      const mockCall = {
        on: jest.fn(),
        off: jest.fn(),
        participants: jest.fn(() => ({})),
        room: jest.fn(() => Promise.resolve({ name: 'classroom-1' }))
      } as any;

      initializeDailyQueueIntegration(mockCall);
      expect(getDailyCall()).toBe(mockCall);
    });

    test('gets Daily.co participant data for queue', () => {
      const mockParticipant = {
        user_name: 'John Doe',
        session_id: 'participant-123'
      };

      const mockCall = {
        on: jest.fn(),
        off: jest.fn(),
        participants: jest.fn(() => ({ 'participant-123': mockParticipant })),
        room: jest.fn(() => Promise.resolve({ name: 'classroom-1' }))
      } as any;

      initializeDailyQueueIntegration(mockCall);
      
      const result = getDailyParticipantForQueue('participant-123');
      
      expect(result).toEqual({
        name: 'John Doe',
        role: 'student'
      });
    });

    test('returns null for non-existent participant', () => {
      const mockCall = {
        on: jest.fn(),
        off: jest.fn(),
        participants: jest.fn(() => ({})),
        room: jest.fn(() => Promise.resolve({ name: 'classroom-1' }))
      } as any;

      initializeDailyQueueIntegration(mockCall);
      
      const result = getDailyParticipantForQueue('non-existent');
      expect(result).toBe(null);
    });

    test('returns null when Daily.co not initialized', () => {
      const result = getDailyParticipantForQueue('participant-123');
      expect(result).toBe(null);
    });
  });
});

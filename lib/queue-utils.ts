// queue-utils.ts - Utility functions for queue management
// This file will contain helper functions for queue operations

import { QueueEntry, QueueState, ActiveSpeaker } from './queue-types';

/**
 * Creates a new queue entry with validation
 */
export function createQueueEntry(
  participantId: string,
  participantName: string,
  classroomId: string,
  role: 'student' | 'instructor'
): QueueEntry {
  return {
    id: crypto.randomUUID(),
    participantId,
    participantName,
    classroomId,
    raisedAt: new Date(),
    position: 1, // Will be updated when added to queue
    isActive: false,
    role
  };
}

/**
 * Validates a queue entry
 */
export function validateQueueEntry(entry: QueueEntry): boolean {
  return (
    !!entry.id &&
    !!entry.participantId &&
    !!entry.participantName &&
    !!entry.classroomId &&
    entry.raisedAt instanceof Date &&
    entry.position > 0 &&
    typeof entry.isActive === 'boolean' &&
    ['student', 'instructor'].includes(entry.role)
  );
}

/**
 * Creates an empty queue state for a classroom
 */
export function createEmptyQueueState(classroomId: string): QueueState {
  return {
    classroomId,
    entries: [],
    activeSpeaker: null,
    maxCapacity: 50,
    lastUpdated: new Date(),
    isActive: true
  };
}

/**
 * Validates a queue state
 */
export function validateQueueState(state: QueueState): boolean {
  return (
    !!state.classroomId &&
    Array.isArray(state.entries) &&
    state.maxCapacity > 0 &&
    state.maxCapacity <= 50 &&
    state.lastUpdated instanceof Date &&
    typeof state.isActive === 'boolean' &&
    state.entries.every(validateQueueEntry)
  );
}

/**
 * Creates an active speaker record
 */
export function createActiveSpeaker(
  participantId: string,
  participantName: string,
  classroomId: string,
  role: 'student' | 'instructor'
): ActiveSpeaker {
  return {
    participantId,
    participantName,
    classroomId,
    calledAt: new Date(),
    role
  };
}

/**
 * Validates an active speaker record
 */
export function validateActiveSpeaker(speaker: ActiveSpeaker): boolean {
  return (
    !!speaker.participantId &&
    !!speaker.participantName &&
    !!speaker.classroomId &&
    speaker.calledAt instanceof Date &&
    ['student', 'instructor'].includes(speaker.role)
  );
}

/**
 * Checks if a participant is already in the queue
 */
export function isParticipantInQueue(
  state: QueueState,
  participantId: string
): boolean {
  return state.entries.some(entry => entry.participantId === participantId);
}

/**
 * Checks if queue is at capacity
 */
export function isQueueAtCapacity(state: QueueState): boolean {
  return state.entries.length >= state.maxCapacity;
}

/**
 * Gets the next position in the queue
 */
export function getNextQueuePosition(state: QueueState): number {
  return state.entries.length + 1;
}

/**
 * Finds a queue entry by participant ID
 */
export function findQueueEntry(
  state: QueueState,
  participantId: string
): QueueEntry | undefined {
  return state.entries.find(entry => entry.participantId === participantId);
}

/**
 * Updates queue entry positions after changes
 */
export function updateQueuePositions(entries: QueueEntry[]): QueueEntry[] {
  return entries
    .sort((a, b) => a.raisedAt.getTime() - b.raisedAt.getTime())
    .map((entry, index) => ({
      ...entry,
      position: index + 1
    }));
}

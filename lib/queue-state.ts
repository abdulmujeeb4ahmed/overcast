// queue-state.ts - Queue state management with Daily.co integration
// This file will contain state management logic and Daily.co integration

import { QueueState, ActiveSpeaker, QueueEvent } from './queue-types';
import {
  createEmptyQueueState,
  createQueueEntry,
  createActiveSpeaker,
  validateQueueState,
  isParticipantInQueue,
  isQueueAtCapacity,
  getNextQueuePosition,
  updateQueuePositions
} from './queue-utils';

// In-memory queue state storage (session-scoped)
const queueStates = new Map<string, QueueState>();

// Performance optimization: Cache for frequently accessed data
const queueStateCache = new Map<string, {
  state: QueueState;
  lastAccessed: number;
  accessCount: number;
}>();

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Maximum number of cached states
const CACHE_CLEANUP_INTERVAL = 60 * 1000; // 1 minute

// Cleanup cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, cached] of queueStateCache.entries()) {
    if (now - cached.lastAccessed > CACHE_TTL) {
      queueStateCache.delete(key);
    }
  }
  
  // If cache is too large, remove least accessed entries
  if (queueStateCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(queueStateCache.entries())
      .sort((a, b) => a[1].accessCount - b[1].accessCount);
    
    const toRemove = entries.slice(0, queueStateCache.size - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => queueStateCache.delete(key));
  }
}, CACHE_CLEANUP_INTERVAL);

/**
 * Gets or creates queue state for a classroom
 * Performance optimized with caching
 */
export function getQueueState(classroomId: string): QueueState {
  console.log(`[Queue Debug] Getting queue state for classroom ${classroomId}`);
  console.log(`[Queue Debug] Current queue states size: ${queueStates.size}`);
  console.log(`[Queue Debug] Current cache size: ${queueStateCache.size}`);
  
  // Check cache first
  const cached = queueStateCache.get(classroomId);
  if (cached && Date.now() - cached.lastAccessed < CACHE_TTL) {
    console.log(`[Queue Debug] Returning cached state for ${classroomId}`);
    cached.lastAccessed = Date.now();
    cached.accessCount++;
    return cached.state;
  }

  // Get from main storage
  if (!queueStates.has(classroomId)) {
    console.log(`[Queue Debug] Creating new queue state for ${classroomId}`);
    queueStates.set(classroomId, createEmptyQueueState(classroomId));
  } else {
    console.log(`[Queue Debug] Found existing queue state for ${classroomId}`);
  }
  
  const state = queueStates.get(classroomId)!;
  console.log(`[Queue Debug] Queue state entries: ${state.entries.length}`);
  
  // Update cache
  queueStateCache.set(classroomId, {
    state,
    lastAccessed: Date.now(),
    accessCount: 1
  });
  
  return state;
}

/**
 * Updates queue state and validates
 * Performance optimized with cache invalidation
 */
export function updateQueueState(
  classroomId: string,
  updater: (state: QueueState) => QueueState
): QueueState {
  const currentState = getQueueState(classroomId);
  const updatedState = updater(currentState);
  
  if (!validateQueueState(updatedState)) {
    throw new Error('Invalid queue state');
  }
  
  updatedState.lastUpdated = new Date();
  queueStates.set(classroomId, updatedState);
  
  // Invalidate cache
  queueStateCache.delete(classroomId);
  
  // Broadcast state change event
  broadcastQueueEvent({
    type: 'queue-updated',
    classroomId,
    data: updatedState,
    timestamp: new Date()
  });
  
  return updatedState;
}

/**
 * Adds a participant to the queue
 */
export function addToQueue(
  classroomId: string,
  participantId: string,
  participantName: string,
  role: 'student' | 'instructor'
): QueueState {
  return updateQueueState(classroomId, (state) => {
    if (isParticipantInQueue(state, participantId)) {
      throw new Error('Participant already in queue');
    }
    
    if (isQueueAtCapacity(state)) {
      throw new Error('Queue at capacity');
    }
    
    if (!state.isActive) {
      throw new Error('Queue is not active');
    }
    
    const newEntry = createQueueEntry(
      participantId,
      participantName,
      classroomId,
      role
    );
    
    newEntry.position = getNextQueuePosition(state);
    
    const updatedEntries = [...state.entries, newEntry];
    const sortedEntries = updateQueuePositions(updatedEntries);
    
    return {
      ...state,
      entries: sortedEntries
    };
  });
}

/**
 * Removes a participant from the queue
 */
export function removeFromQueue(
  classroomId: string,
  participantId: string
): QueueState {
  return updateQueueState(classroomId, (state) => {
    const filteredEntries = state.entries.filter(
      entry => entry.participantId !== participantId
    );
    
    const sortedEntries = updateQueuePositions(filteredEntries);
    
    return {
      ...state,
      entries: sortedEntries
    };
  });
}

/**
 * Calls on the next participant in the queue
 */
export function callOnNextParticipant(
  classroomId: string,
  _instructorId: string
): { queueState: QueueState; activeSpeaker: ActiveSpeaker } {
  const state = getQueueState(classroomId);
  
  if (state.entries.length === 0) {
    throw new Error('No participants in queue');
  }
  
  if (state.activeSpeaker) {
    throw new Error('There is already an active speaker');
  }
  
  const nextEntry = state.entries[0]; // First in queue
  const activeSpeaker = createActiveSpeaker(
    nextEntry.participantId,
    nextEntry.participantName,
    classroomId,
    nextEntry.role
  );
  
  const updatedState = updateQueueState(classroomId, (state) => {
    const filteredEntries = state.entries.filter(
      entry => entry.participantId !== nextEntry.participantId
    );
    
    const sortedEntries = updateQueuePositions(filteredEntries);
    
    return {
      ...state,
      entries: sortedEntries,
      activeSpeaker: activeSpeaker.participantId
    };
  });
  
  return { queueState: updatedState, activeSpeaker };
}

/**
 * Clears the active speaker
 */
export function clearActiveSpeaker(classroomId: string): QueueState {
  return updateQueueState(classroomId, (state) => ({
    ...state,
    activeSpeaker: null
  }));
}

/**
 * Lowers all hands and clears the queue
 */
export function lowerAllHands(classroomId: string): QueueState {
  return updateQueueState(classroomId, (state) => ({
    ...state,
    entries: [],
    activeSpeaker: null
  }));
}

/**
 * Handles participant leaving (removes from queue and clears active speaker if needed)
 */
export function handleParticipantLeave(
  classroomId: string,
  participantId: string
): QueueState {
  return updateQueueState(classroomId, (state) => {
    const filteredEntries = state.entries.filter(
      entry => entry.participantId !== participantId
    );
    
    const sortedEntries = updateQueuePositions(filteredEntries);
    
    const newActiveSpeaker = state.activeSpeaker === participantId 
      ? null 
      : state.activeSpeaker;
    
    return {
      ...state,
      entries: sortedEntries,
      activeSpeaker: newActiveSpeaker
    };
  });
}

/**
 * Resets queue state for a classroom (session end)
 */
export function resetQueueState(classroomId: string): void {
  queueStates.delete(classroomId);
  queueStateCache.delete(classroomId); // Clear cache too
  
  // Broadcast reset event
  broadcastQueueEvent({
    type: 'queue-updated',
    classroomId,
    data: null,
    timestamp: new Date()
  });
}

/**
 * Performance optimization: Clear all caches
 * Useful for memory management or testing
 */
export function clearAllCaches(): void {
  queueStateCache.clear();
  console.log('Queue state cache cleared');
}

/**
 * Performance optimization: Get cache statistics
 * Useful for monitoring and debugging
 */
export function getCacheStats(): {
  cacheSize: number;
  totalAccesses: number;
  averageAccessTime: number;
} {
  const entries = Array.from(queueStateCache.values());
  const totalAccesses = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
  const averageAccessTime = entries.length > 0 
    ? entries.reduce((sum, entry) => sum + (Date.now() - entry.lastAccessed), 0) / entries.length
    : 0;
    
  return {
    cacheSize: queueStateCache.size,
    totalAccesses,
    averageAccessTime
  };
}

/**
 * Event listeners for queue events
 */
const queueEventListeners = new Set<(event: QueueEvent) => void>();

/**
 * Adds a queue event listener
 */
export function addQueueEventListener(listener: (event: QueueEvent) => void): void {
  queueEventListeners.add(listener);
}

/**
 * Removes a queue event listener
 */
export function removeQueueEventListener(listener: (event: QueueEvent) => void): void {
  queueEventListeners.delete(listener);
}

/**
 * Broadcasts a queue event to all listeners
 */
function broadcastQueueEvent(event: QueueEvent): void {
  queueEventListeners.forEach(listener => {
    try {
      listener(event);
    } catch (error) {
      console.error('Error in queue event listener:', error);
    }
  });
}

/**
 * Daily.co integration helpers
 * Integrates queue state management with Daily.co participant events
 */
import { DailyParticipant, DailyCall } from '@daily-co/daily-js';
import { parseDailyError, getParticipantRole } from './daily-utils';

// Daily.co event listeners for queue integration
let dailyCall: DailyCall | null = null;
let isDailyIntegrationActive = false;

/**
 * Initialize Daily.co integration for queue management
 * Sets up event listeners for participant join/leave events
 */
export function initializeDailyQueueIntegration(call: DailyCall): void {
  if (isDailyIntegrationActive) {
    console.warn('Daily.co queue integration already initialized');
    return;
  }

  dailyCall = call;
  isDailyIntegrationActive = true;

  // Set up Daily.co event listeners
  call.on('participant-joined', handleParticipantJoined);
  call.on('participant-left', handleParticipantLeft);
  call.on('error', handleDailyError);

  console.log('Daily.co queue integration initialized');
}

/**
 * Clean up Daily.co integration
 * Removes event listeners and clears references
 */
export function cleanupDailyQueueIntegration(): void {
  if (!isDailyIntegrationActive || !dailyCall) {
    return;
  }

  // Remove event listeners
  dailyCall.off('participant-joined', handleParticipantJoined);
  dailyCall.off('participant-left', handleParticipantLeft);
  dailyCall.off('error', handleDailyError);

  dailyCall = null;
  isDailyIntegrationActive = false;

  console.log('Daily.co queue integration cleaned up');
}

/**
 * Handle participant joining Daily.co call
 * Automatically removes them from any existing queue entries
 */
async function handleParticipantJoined(event: { participant: DailyParticipant }): Promise<void> {
  try {
    // Get classroom ID from Daily.co room name or URL
    const classroomId = await extractClassroomIdFromDailyRoom();
    if (!classroomId) {
      console.warn('Could not determine classroom ID for queue integration');
      return;
    }

    const participantId = event.participant.session_id;
    
    // If participant was in queue before joining, remove them
    const currentState = getQueueState(classroomId);
    if (isParticipantInQueue(currentState, participantId)) {
      removeFromQueue(classroomId, participantId);
      console.log(`Removed participant ${participantId} from queue (rejoined call)`);
    }
  } catch (error) {
    console.error('Error handling participant joined event:', error);
  }
}

/**
 * Handle participant leaving Daily.co call
 * Automatically removes them from queue and clears active speaker if needed
 */
async function handleParticipantLeft(event: { participant: DailyParticipant }): Promise<void> {
  try {
    const classroomId = await extractClassroomIdFromDailyRoom();
    if (!classroomId) {
      console.warn('Could not determine classroom ID for queue integration');
      return;
    }

    const participantId = event.participant.session_id;
    
    // Remove from queue and clear active speaker if needed
    handleParticipantLeave(classroomId, participantId);
    console.log(`Handled participant ${participantId} leaving (removed from queue)`);
  } catch (error) {
    console.error('Error handling participant left event:', error);
  }
}

/**
 * Handle Daily.co errors
 * Logs errors and handles queue-specific error scenarios
 */
function handleDailyError(error: unknown): void {
  const parsedError = parseDailyError(error);
  console.error('Daily.co error in queue integration:', parsedError.message);
  
  // For certain errors, we might want to reset queue state
  if (parsedError.type === 'connection-error' || parsedError.type === 'network-error') {
    console.warn('Connection error detected - queue state preserved but monitoring connection');
  }
}

/**
 * Extract classroom ID from Daily.co room
 * Maps Daily.co room URL/name to classroom ID (1-6)
 */
async function extractClassroomIdFromDailyRoom(): Promise<string | null> {
  if (!dailyCall) return null;

  try {
    const room = await dailyCall.room();
    if (!room) return null;
    
    // Handle different room types
    const roomUrl = 'url' in room ? (room.url as string) : '';
    const roomName = 'name' in room ? (room.name as string) : '';
    
    // Extract room name from URL (e.g., "cohort-1" -> "1")
    const roomNameMatch = roomUrl.match(/(?:cohort-|room-|class-)(\d+)/i);
    if (roomNameMatch) {
      const roomNumber = roomNameMatch[1];
      // Validate it's a classroom ID (1-6)
      if (['1', '2', '3', '4', '5', '6'].includes(roomNumber)) {
        return roomNumber;
      }
    }
    
    // Fallback: try to extract from room name
    const nameMatch = roomName.match(/(\d+)/);
    if (nameMatch && ['1', '2', '3', '4', '5', '6'].includes(nameMatch[1])) {
      return nameMatch[1];
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting classroom ID from Daily.co room:', error);
    return null;
  }
}

/**
 * Get current Daily.co participant data for queue operations
 * Helper function to get participant info for queue entries
 */
export function getDailyParticipantForQueue(
  participantId: string
): { name: string; role: 'student' | 'instructor' } | null {
  if (!dailyCall) return null;

  try {
    const participant = dailyCall.participants()[participantId];
    if (!participant) return null;

    const name = participant.user_name || 'Unknown';
    const role = getParticipantRole(participant);
    
    return { name, role };
  } catch (error) {
    console.error('Error getting Daily.co participant for queue:', error);
    return null;
  }
}

/**
 * Check if Daily.co integration is active
 */
export function isDailyQueueIntegrationActive(): boolean {
  return isDailyIntegrationActive;
}

/**
 * Get current Daily.co call instance
 */
export function getDailyCall(): DailyCall | null {
  return dailyCall;
}

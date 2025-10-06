// queue-types.ts - Type definitions for queue system
// This file will contain the core type definitions from data-model.md

// QueueEntry type definition
export interface QueueEntry {
  id: string;
  participantId: string;
  participantName: string;
  classroomId: string;
  raisedAt: Date;
  position: number;
  isActive: boolean;
  role: 'student' | 'instructor';
}

// QueueState type definition
export interface QueueState {
  classroomId: string;
  entries: QueueEntry[];
  activeSpeaker: string | null;
  maxCapacity: number;
  lastUpdated: Date;
  isActive: boolean;
}

// ActiveSpeaker type definition
export interface ActiveSpeaker {
  participantId: string;
  participantName: string;
  classroomId: string;
  calledAt: Date;
  role: 'student' | 'instructor';
}

// Queue operation types
export type QueueOperation = 
  | 'raise-hand'
  | 'lower-hand'
  | 'call-on'
  | 'lower-individual'
  | 'lower-all';

// Queue event types for real-time updates
export interface QueueEvent {
  type: 'queue-updated' | 'participant-joined' | 'participant-left' | 'speaker-changed';
  classroomId: string;
  data: QueueState | QueueEntry | ActiveSpeaker | null;
  timestamp: Date;
}

// Error types
export interface QueueError {
  error: string;
  message: string;
  code?: string;
}

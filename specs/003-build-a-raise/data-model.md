# Data Model: Raise Hand + Queue System

**Feature**: Raise Hand + Queue System for Live Classes  
**Date**: 2025-10-03  
**Status**: Complete

## Core Entities

### QueueEntry
**Purpose**: Represents a participant's request to speak in the queue

**Attributes**:
- `id: string` - Unique identifier for the queue entry (UUID)
- `participantId: string` - Daily.co participant session ID
- `participantName: string` - Display name of the participant
- `classroomId: string` - Classroom identifier (1-6)
- `raisedAt: Date` - Timestamp when hand was raised
- `position: number` - Position in queue (1-based, 1 = next to speak)
- `isActive: boolean` - Whether this participant is currently speaking
- `role: 'student' | 'instructor'` - Participant role

**Validation Rules**:
- Participant ID must be valid Daily.co session ID
- Position must be positive integer
- Raised timestamp must be current or past
- Only one entry per participant per classroom
- Position automatically assigned based on FIFO order

**State Transitions**:
```
Not in Queue → In Queue (raise hand)
In Queue → Active Speaker (called on by instructor)
In Queue → Not in Queue (lower hand or leave)
Active Speaker → Not in Queue (finish speaking or leave)
```

### QueueState
**Purpose**: Represents the current state of the speaking queue for a classroom

**Attributes**:
- `classroomId: string` - Classroom identifier (1-6)
- `entries: QueueEntry[]` - Ordered list of queue entries
- `activeSpeaker: string | null` - Participant ID of current speaker
- `maxCapacity: number` - Maximum queue size (configurable, default 50)
- `lastUpdated: Date` - Timestamp of last state change
- `isActive: boolean` - Whether queue is accepting new entries

**Validation Rules**:
- Entries must be ordered by raisedAt timestamp
- Active speaker cannot be in entries array
- Max capacity cannot be exceeded
- All entries must belong to same classroom
- Last updated must be current or past

**Relationships**:
- Contains multiple QueueEntry objects
- References single Classroom
- Tracks single ActiveSpeaker

### ActiveSpeaker
**Purpose**: Represents the participant currently speaking

**Attributes**:
- `participantId: string` - Daily.co participant session ID
- `participantName: string` - Display name
- `classroomId: string` - Classroom identifier
- `calledAt: Date` - When instructor called on this participant
- `role: 'student' | 'instructor'` - Participant role

**Validation Rules**:
- Only one active speaker per classroom
- Called timestamp must be current or past
- Participant must exist in classroom
- Cannot be in queue while active

**State Transitions**:
```
Not Active → Active (called on by instructor)
Active → Not Active (finish speaking or leave)
```

## Data Relationships

### Classroom → QueueState (1:1)
- Each classroom has exactly one queue state
- Queue state is created when first participant raises hand
- Queue state is destroyed when classroom session ends

### QueueState → QueueEntry (1:many)
- Queue state contains ordered list of entries
- Entries are automatically ordered by timestamp
- Entries are removed when participant leaves or is called on

### QueueState → ActiveSpeaker (1:0..1)
- Queue state may have zero or one active speaker
- Active speaker is set when instructor calls on participant
- Active speaker is cleared when participant finishes or leaves

## State Management

### Session Scoping
- All queue data is session-scoped (temporary)
- Data is automatically cleaned up when classroom session ends
- No persistent storage required
- State is synchronized in real-time across all participants

### Real-time Synchronization
- State changes are broadcast via Daily.co events
- All participants receive updates within 200ms
- Optimistic UI updates for immediate feedback
- Conflict resolution through server authority

### Data Persistence
- No database persistence required
- State stored in memory during session
- Automatic cleanup on participant departure
- Session reset when classroom ends

## Validation Rules

### Queue Entry Validation
- Participant must be in classroom
- Participant cannot already be in queue
- Queue must not exceed capacity
- Timestamp must be valid

### Queue State Validation
- Entries must be properly ordered
- Active speaker cannot be in queue
- Capacity limits must be enforced
- State consistency must be maintained

### Cross-Entity Validation
- Participant cannot be active speaker and in queue simultaneously
- All entities must reference same classroom
- Timestamps must be consistent
- Participant IDs must be valid Daily.co session IDs

## Error Handling

### Network Disconnections
- Queue state preserved during brief disconnections
- Automatic cleanup after extended absence
- Graceful reconnection with state restoration
- User notification of connection issues

### Invalid Operations
- Prevent duplicate queue entries
- Enforce capacity limits
- Validate participant permissions
- Handle concurrent modifications

### State Recovery
- Automatic state reconstruction from events
- Conflict resolution through timestamp ordering
- Fallback to basic functionality on errors
- User notification of state issues

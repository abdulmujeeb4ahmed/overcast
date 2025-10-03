# Quickstart: Raise Hand + Queue System

**Feature**: Raise Hand + Queue System for Live Classes  
**Date**: 2025-10-03  
**Status**: Complete

## Overview

This quickstart guide demonstrates the Raise Hand + Queue system for live classrooms. The system allows participants to raise their hands to request speaking permission, while instructors can manage the speaking queue in a fair, orderly manner.

## Prerequisites

- Active classroom session with participants
- Instructor and student roles properly assigned
- Daily.co integration working
- Real-time communication enabled

## User Journey: Basic Queue Flow

### 1. Participant Raises Hand

**Scenario**: Student wants to ask a question during class

**Steps**:
1. Student clicks "Raise Hand" button in classroom interface
2. System adds student to queue with timestamp
3. Student sees confirmation: "You're #2 in line"
4. Instructor sees student's name appear in queue panel
5. Other participants see "hand raised" badge next to student's name

**Expected Result**: Student is added to queue in FIFO order

### 2. Instructor Calls On Next Person

**Scenario**: Instructor wants to let the next person speak

**Steps**:
1. Instructor views queue panel showing ordered list
2. Instructor clicks "Call On" button for next person
3. System marks participant as active speaker
4. Participant is removed from queue
5. All participants see active speaker status
6. Queue automatically reorders remaining participants

**Expected Result**: Next participant becomes active speaker

### 3. Participant Lowers Hand

**Scenario**: Student decides they no longer want to speak

**Steps**:
1. Student clicks "Raise Hand" button again (now shows "Lower Hand")
2. System removes student from queue
3. Student sees confirmation: "Hand lowered"
4. Queue automatically reorders remaining participants
5. Instructor sees updated queue

**Expected Result**: Student is removed from queue

## User Journey: Instructor Controls

### 1. Lower Individual Hand

**Scenario**: Instructor wants to remove specific participant from queue

**Steps**:
1. Instructor views queue panel
2. Instructor clicks "Lower Hand" next to specific participant
3. System removes participant from queue
4. Participant sees notification: "Instructor lowered your hand"
5. Queue automatically reorders

**Expected Result**: Specific participant removed from queue

### 2. Lower All Hands

**Scenario**: Instructor wants to clear entire queue

**Steps**:
1. Instructor clicks "Lower All Hands" button
2. System clears entire queue
3. All participants see notification: "All hands lowered"
4. Queue panel shows empty state
5. All "hand raised" badges disappear

**Expected Result**: Entire queue cleared

## User Journey: Edge Cases

### 1. Participant Leaves During Queue

**Scenario**: Student raises hand then leaves classroom

**Steps**:
1. Student raises hand and joins queue
2. Student leaves classroom (network issue, etc.)
3. System automatically removes student from queue
4. Instructor sees updated queue without student
5. Remaining participants see reordered positions

**Expected Result**: Student automatically removed from queue

### 2. Active Speaker Leaves

**Scenario**: Person currently speaking disconnects

**Steps**:
1. Active speaker is talking
2. Active speaker leaves classroom
3. System automatically advances to next person in queue
4. Next person becomes active speaker
5. All participants see new active speaker

**Expected Result**: Queue automatically advances to next person

### 3. Queue at Capacity

**Scenario**: Too many people want to speak

**Steps**:
1. Student tries to raise hand when queue is full
2. System shows message: "Queue is full, please try again later"
3. Student cannot join queue
4. Instructor sees queue at capacity
5. Student can try again when space becomes available

**Expected Result**: Queue capacity enforced with friendly message

## User Journey: Accessibility

### 1. Keyboard Navigation

**Scenario**: User navigates queue using keyboard only

**Steps**:
1. User tabs to "Raise Hand" button
2. User presses Enter to raise hand
3. User tabs to queue panel
4. User navigates queue items with arrow keys
5. User presses Enter to call on participant

**Expected Result**: All queue actions accessible via keyboard

### 2. Screen Reader Support

**Scenario**: User with screen reader uses queue system

**Steps**:
1. Screen reader announces "Raise Hand button"
2. User activates button
3. Screen reader announces "You're #2 in line"
4. Screen reader announces queue changes
5. Screen reader announces when called on

**Expected Result**: All queue actions announced to screen readers

## User Journey: Real-time Updates

### 1. Multiple Participants Raise Hands

**Scenario**: Several students want to speak simultaneously

**Steps**:
1. Student A raises hand (position #1)
2. Student B raises hand (position #2)
3. Student C raises hand (position #3)
4. All participants see updated queue
5. Instructor sees ordered list: A, B, C
6. Each student sees their position

**Expected Result**: All participants see real-time queue updates

### 2. Instructor Calls On Person

**Scenario**: Instructor manages speaking order

**Steps**:
1. Instructor calls on Student A (position #1)
2. Student A becomes active speaker
3. Student B moves to position #1
4. Student C moves to position #2
5. All participants see updated positions
6. Student A sees "You're speaking" status

**Expected Result**: Queue automatically reorders for all participants

## Success Criteria

### Functional Success
- [ ] Participants can raise and lower hands
- [ ] Instructors can see ordered queue
- [ ] Instructors can call on next person
- [ ] Queue automatically reorders
- [ ] Participants see their position
- [ ] Real-time updates work across all participants

### User Experience Success
- [ ] Actions feel immediate and responsive
- [ ] Visual feedback is clear and consistent
- [ ] Error messages are helpful
- [ ] Queue behavior is predictable
- [ ] Accessibility features work properly

### Technical Success
- [ ] No duplicate queue entries
- [ ] Automatic cleanup on participant departure
- [ ] Queue state persists across page refreshes
- [ ] Real-time synchronization works reliably
- [ ] Performance is smooth with 50 participants

## Troubleshooting

### Common Issues

**Issue**: Participant can't raise hand
- **Check**: Participant is in classroom
- **Check**: Queue is not at capacity
- **Check**: Participant is not already in queue

**Issue**: Queue not updating in real-time
- **Check**: Network connection
- **Check**: Daily.co connection status
- **Check**: Browser refresh

**Issue**: Instructor can't call on participants
- **Check**: User has instructor role
- **Check**: Queue is not empty
- **Check**: Participant is still in classroom

### Error Messages

- "You're already in the queue" - Participant tried to raise hand twice
- "Queue is full" - Maximum capacity reached
- "Participant not found" - Participant left classroom
- "Not an instructor" - User lacks instructor permissions
- "Queue is empty" - No participants to call on

## Next Steps

After completing this quickstart:
1. Test with multiple participants
2. Verify real-time updates
3. Check accessibility features
4. Test edge cases and error handling
5. Validate performance with full classroom

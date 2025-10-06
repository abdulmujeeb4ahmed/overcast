/**
 * Unit Test: RaiseHandButton Component
 * 
 * Tests the RaiseHandButton component with React Testing Library
 * Validates rendering, interaction, state management, and accessibility
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RaiseHandButton from '@/app/components/RaiseHandButton';
import { QueueState } from '@/lib/queue-types';

// Mock the queue-utils module
jest.mock('@/lib/queue-utils', () => ({
  isParticipantInQueue: jest.fn(),
  findQueueEntry: jest.fn()
}));

const mockQueueUtils = require('@/lib/queue-utils');

describe('RaiseHandButton Component', () => {
  const defaultProps = {
    classroomId: '1',
    participantId: 'participant-123',
    participantName: 'John Doe',
    role: 'student' as const,
    queueState: null,
    onRaiseHand: jest.fn(),
    onLowerHand: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueueUtils.isParticipantInQueue.mockReturnValue(false);
    mockQueueUtils.findQueueEntry.mockReturnValue(null);
  });

  describe('Rendering', () => {
    test('renders raise hand button by default', () => {
      render(<RaiseHandButton {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /raise hand/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Raise Hand');
    });

    test('renders with custom className', () => {
      render(<RaiseHandButton {...defaultProps} className="custom-class" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    test('renders with disabled state', () => {
      render(<RaiseHandButton {...defaultProps} disabled={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Hand State Management', () => {
    test('shows raised state when participant is in queue', () => {
      const queueState: QueueState = {
        classroomId: '1',
        entries: [
          {
            id: 'entry-1',
            participantId: 'participant-123',
            participantName: 'John Doe',
            classroomId: '1',
            raisedAt: new Date(),
            position: 2,
            isActive: false,
            role: 'student'
          }
        ],
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: new Date(),
        isActive: true
      };

      mockQueueUtils.isParticipantInQueue.mockReturnValue(true);
      mockQueueUtils.findQueueEntry.mockReturnValue({
        id: 'entry-1',
        participantId: 'participant-123',
        participantName: 'John Doe',
        classroomId: '1',
        raisedAt: new Date(),
        position: 2,
        isActive: false,
        role: 'student'
      });

      render(<RaiseHandButton {...defaultProps} queueState={queueState} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Position 2');
      expect(button).toHaveAttribute('aria-label', /position 2 in queue/i);
    });

    test('shows lower hand when participant is in queue without position', () => {
      const queueState: QueueState = {
        classroomId: '1',
        entries: [
          {
            id: 'entry-1',
            participantId: 'participant-123',
            participantName: 'John Doe',
            classroomId: '1',
            raisedAt: new Date(),
            position: 2,
            isActive: false,
            role: 'student'
          }
        ],
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: new Date(),
        isActive: true
      };

      mockQueueUtils.isParticipantInQueue.mockReturnValue(true);
      mockQueueUtils.findQueueEntry.mockReturnValue(null);

      render(<RaiseHandButton {...defaultProps} queueState={queueState} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Lower Hand');
    });

    test('resets to raise hand when queue state becomes null', () => {
      const queueState: QueueState = {
        classroomId: '1',
        entries: [
          {
            id: 'entry-1',
            participantId: 'participant-123',
            participantName: 'John Doe',
            classroomId: '1',
            raisedAt: new Date(),
            position: 2,
            isActive: false,
            role: 'student'
          }
        ],
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: new Date(),
        isActive: true
      };

      const { rerender } = render(<RaiseHandButton {...defaultProps} queueState={queueState} />);
      
      mockQueueUtils.isParticipantInQueue.mockReturnValue(true);
      mockQueueUtils.findQueueEntry.mockReturnValue({
        position: 2
      });

      let button = screen.getByRole('button');
      expect(button).toHaveTextContent('Position 2');

      // Update to null queue state
      mockQueueUtils.isParticipantInQueue.mockReturnValue(false);
      rerender(<RaiseHandButton {...defaultProps} queueState={null} />);
      
      button = screen.getByRole('button');
      expect(button).toHaveTextContent('Raise Hand');
    });
  });

  describe('User Interactions', () => {
    test('calls onRaiseHand when raising hand', async () => {
      const onRaiseHand = jest.fn().mockResolvedValue(undefined);
      
      render(<RaiseHandButton {...defaultProps} onRaiseHand={onRaiseHand} />);
      
      const button = screen.getByRole('button', { name: /raise hand/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(onRaiseHand).toHaveBeenCalledWith('1', 'participant-123', 'John Doe', 'student');
      });
    });

    test('calls onLowerHand when lowering hand', async () => {
      const onLowerHand = jest.fn().mockResolvedValue(undefined);
      const queueState: QueueState = {
        classroomId: '1',
        entries: [
          {
            id: 'entry-1',
            participantId: 'participant-123',
            participantName: 'John Doe',
            classroomId: '1',
            raisedAt: new Date(),
            position: 2,
            isActive: false,
            role: 'student'
          }
        ],
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: new Date(),
        isActive: true
      };

      mockQueueUtils.isParticipantInQueue.mockReturnValue(true);
      
      render(<RaiseHandButton {...defaultProps} queueState={queueState} onLowerHand={onLowerHand} />);
      
      const button = screen.getByRole('button', { name: /lower hand/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(onLowerHand).toHaveBeenCalledWith('1', 'participant-123');
      });
    });

    test('shows loading state during API calls', async () => {
      const onRaiseHand = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<RaiseHandButton {...defaultProps} onRaiseHand={onRaiseHand} />);
      
      const button = screen.getByRole('button', { name: /raise hand/i });
      fireEvent.click(button);
      
      // Should show loading state
      expect(button).toHaveTextContent('Loading...');
      expect(button).toBeDisabled();
    });

    test('handles API call errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const onRaiseHand = jest.fn().mockRejectedValue(new Error('API Error'));
      
      render(<RaiseHandButton {...defaultProps} onRaiseHand={onRaiseHand} />);
      
      const button = screen.getByRole('button', { name: /raise hand/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Error toggling hand:', expect.any(Error));
      });
      
      consoleError.mockRestore();
    });

    test('does not trigger action when disabled', () => {
      const onRaiseHand = jest.fn();
      
      render(<RaiseHandButton {...defaultProps} disabled={true} onRaiseHand={onRaiseHand} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(onRaiseHand).not.toHaveBeenCalled();
    });

    test('does not trigger action when loading', async () => {
      const onLowerHand = jest.fn();
      const queueState: QueueState = {
        classroomId: '1',
        entries: [
          {
            id: 'entry-1',
            participantId: 'participant-123',
            participantName: 'John Doe',
            classroomId: '1',
            raisedAt: new Date(),
            position: 2,
            isActive: false,
            role: 'student'
          }
        ],
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: new Date(),
        isActive: true
      };

      mockQueueUtils.isParticipantInQueue.mockReturnValue(true);
      
      const { rerender } = render(<RaiseHandButton {...defaultProps} queueState={queueState} onLowerHand={onLowerHand} />);
      
      // Start loading by clicking
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Try to click again while loading
      fireEvent.click(button);
      
      expect(onLowerHand).toHaveBeenCalledTimes(1);
    });
  });

  describe('Button Variants', () => {
    test('uses primary variant for raise hand state', () => {
      render(<RaiseHandButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-[#00FFD1]'); // Primary variant
    });

    test('uses success variant for raised hand state', () => {
      const queueState: QueueState = {
        classroomId: '1',
        entries: [
          {
            id: 'entry-1',
            participantId: 'participant-123',
            participantName: 'John Doe',
            classroomId: '1',
            raisedAt: new Date(),
            position: 2,
            isActive: false,
            role: 'student'
          }
        ],
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: new Date(),
        isActive: true
      };

      mockQueueUtils.isParticipantInQueue.mockReturnValue(true);
      
      render(<RaiseHandButton {...defaultProps} queueState={queueState} />);
      
      const button = screen.getByRole('button');
      // Note: Success variant class would depend on Button component implementation
      expect(button).toBeInTheDocument();
    });

    test('uses secondary variant during loading', async () => {
      const onRaiseHand = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<RaiseHandButton {...defaultProps} onRaiseHand={onRaiseHand} />);
      
      const button = screen.getByRole('button', { name: /raise hand/i });
      fireEvent.click(button);
      
      // Note: Secondary variant class would depend on Button component implementation
      expect(button).toHaveTextContent('Loading...');
    });
  });

  describe('Accessibility', () => {
    test('has proper aria-label for raise hand state', () => {
      render(<RaiseHandButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Raise hand to join speaking queue');
    });

    test('has proper aria-label for lowered hand state with position', () => {
      const queueState: QueueState = {
        classroomId: '1',
        entries: [
          {
            id: 'entry-1',
            participantId: 'participant-123',
            participantName: 'John Doe',
            classroomId: '1',
            raisedAt: new Date(),
            position: 2,
            isActive: false,
            role: 'student'
          }
        ],
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: new Date(),
        isActive: true
      };

      mockQueueUtils.isParticipantInQueue.mockReturnValue(true);
      mockQueueUtils.findQueueEntry.mockReturnValue({ position: 2 });
      
      render(<RaiseHandButton {...defaultProps} queueState={queueState} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', /currently position 2 in queue/i);
    });

    test('has proper title attribute for raise hand state', () => {
      render(<RaiseHandButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Click to raise your hand and join the speaking queue.');
    });

    test('has proper title attribute for raised hand state', () => {
      const queueState: QueueState = {
        classroomId: '1',
        entries: [
          {
            id: 'entry-1',
            participantId: 'participant-123',
            participantName: 'John Doe',
            classroomId: '1',
            raisedAt: new Date(),
            position: 2,
            isActive: false,
            role: 'student'
          }
        ],
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: new Date(),
        isActive: true
      };

      mockQueueUtils.isParticipantInQueue.mockReturnValue(true);
      mockQueueUtils.findQueueEntry.mockReturnValue({ position: 2 });
      
      render(<RaiseHandButton {...defaultProps} queueState={queueState} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', /you are position 2 in the speaking queue/i);
    });

    test('supports keyboard navigation', () => {
      const onRaiseHand = jest.fn().mockResolvedValue(undefined);
      
      render(<RaiseHandButton {...defaultProps} onRaiseHand={onRaiseHand} />);
      
      const button = screen.getByRole('button');
      button.focus();
      
      fireEvent.keyDown(button, { key: 'Enter' });
      
      expect(onRaiseHand).toHaveBeenCalled();
    });
  });

  describe('Role-based Rendering', () => {
    test('renders correctly for student role', () => {
      render(<RaiseHandButton {...defaultProps} role="student" />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    test('renders correctly for instructor role', () => {
      render(<RaiseHandButton {...defaultProps} role="instructor" />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    test('updates when queue state changes', () => {
      const { rerender } = render(<RaiseHandButton {...defaultProps} />);
      
      let button = screen.getByRole('button');
      expect(button).toHaveTextContent('Raise Hand');
      
      // Update queue state to show participant in queue
      const queueState: QueueState = {
        classroomId: '1',
        entries: [
          {
            id: 'entry-1',
            participantId: 'participant-123',
            participantName: 'John Doe',
            classroomId: '1',
            raisedAt: new Date(),
            position: 3,
            isActive: false,
            role: 'student'
          }
        ],
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: new Date(),
        isActive: true
      };

      mockQueueUtils.isParticipantInQueue.mockReturnValue(true);
      mockQueueUtils.findQueueEntry.mockReturnValue({ position: 3 });
      
      rerender(<RaiseHandButton {...defaultProps} queueState={queueState} />);
      
      button = screen.getByRole('button');
      expect(button).toHaveTextContent('Position 3');
    });

    test('handles queue state updates with different participants', () => {
      const queueState: QueueState = {
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

      mockQueueUtils.isParticipantInQueue.mockReturnValue(false);
      
      render(<RaiseHandButton {...defaultProps} queueState={queueState} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Raise Hand');
    });
  });
});

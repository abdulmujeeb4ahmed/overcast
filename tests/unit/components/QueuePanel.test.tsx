/**
 * Unit Test: QueuePanel Component
 * 
 * Tests the QueuePanel component with React Testing Library
 * Validates rendering, instructor controls, queue management, and accessibility
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import QueuePanel from '@/app/components/QueuePanel';
import { QueueState, ActiveSpeaker } from '@/lib/queue-types';

describe('QueuePanel Component', () => {
  const defaultProps = {
    classroomId: '1',
    queueState: null,
    activeSpeaker: null,
    instructorId: 'instructor-123',
    onCallOnNext: jest.fn(),
    onLowerIndividual: jest.fn(),
    onLowerAll: jest.fn()
  };

  const mockQueueEntry = {
    id: 'entry-1',
    participantId: 'participant-123',
    participantName: 'John Doe',
    classroomId: '1',
    raisedAt: new Date(Date.now() - 30000), // 30 seconds ago
    position: 1,
    isActive: false,
    role: 'student' as const
  };

  const mockQueueState: QueueState = {
    classroomId: '1',
    entries: [
      mockQueueEntry,
      {
        id: 'entry-2',
        participantId: 'participant-456',
        participantName: 'Jane Smith',
        classroomId: '1',
        raisedAt: new Date(Date.now() - 60000), // 1 minute ago
        position: 2,
        isActive: false,
        role: 'instructor' as const
      }
    ],
    activeSpeaker: null,
    maxCapacity: 50,
    lastUpdated: new Date(),
    isActive: true
  };

  const mockActiveSpeaker: ActiveSpeaker = {
    participantId: 'participant-789',
    participantName: 'Alice Johnson',
    classroomId: '1',
    calledAt: new Date(Date.now() - 120000), // 2 minutes ago
    role: 'student'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders empty state when no queue entries', () => {
      render(<QueuePanel {...defaultProps} />);
      
      expect(screen.getByText('No hands raised')).toBeInTheDocument();
      expect(screen.getByText('Participants will appear here when they raise their hands')).toBeInTheDocument();
    });

    test('renders queue entries when available', () => {
      render(<QueuePanel {...defaultProps} queueState={mockQueueState} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Position
      expect(screen.getByText('2')).toBeInTheDocument(); // Position
    });

    test('renders active speaker section when available', () => {
      render(<QueuePanel {...defaultProps} activeSpeaker={mockActiveSpeaker} />);
      
      expect(screen.getByText('Currently Speaking')).toBeInTheDocument();
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    test('renders with custom className', () => {
      render(<QueuePanel {...defaultProps} className="custom-class" />);
      
      const container = screen.getByText('Speaking Queue').closest('div')?.parentElement;
      expect(container).toHaveClass('custom-class');
    });

    test('renders queue statistics', () => {
      render(<QueuePanel {...defaultProps} queueState={mockQueueState} />);
      
      expect(screen.getByText('2')).toBeInTheDocument(); // Queue length
      expect(screen.getByText('50')).toBeInTheDocument(); // Max capacity
    });
  });

  describe('Active Speaker Display', () => {
    test('shows active speaker information correctly', () => {
      render(<QueuePanel {...defaultProps} activeSpeaker={mockActiveSpeaker} />);
      
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('student')).toBeInTheDocument();
    });

    test('formats time since called correctly', () => {
      render(<QueuePanel {...defaultProps} activeSpeaker={mockActiveSpeaker} />);
      
      // Should show "2m 0s ago" (2 minutes ago)
      expect(screen.getByText(/2m.*s ago/)).toBeInTheDocument();
    });

    test('does not render active speaker section when null', () => {
      render(<QueuePanel {...defaultProps} />);
      
      expect(screen.queryByText('Currently Speaking')).not.toBeInTheDocument();
    });
  });

  describe('Queue Management Controls', () => {
    test('renders call next and clear all buttons', () => {
      render(<QueuePanel {...defaultProps} queueState={mockQueueState} />);
      
      expect(screen.getByRole('button', { name: /call next/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
    });

    test('disables buttons when queue is empty', () => {
      render(<QueuePanel {...defaultProps} />);
      
      const callNextButton = screen.getByRole('button', { name: /call next/i });
      const clearAllButton = screen.getByRole('button', { name: /clear all/i });
      
      expect(callNextButton).toBeDisabled();
      expect(clearAllButton).toBeDisabled();
    });

    test('enables buttons when queue has entries', () => {
      render(<QueuePanel {...defaultProps} queueState={mockQueueState} />);
      
      const callNextButton = screen.getByRole('button', { name: /call next/i });
      const clearAllButton = screen.getByRole('button', { name: /clear all/i });
      
      expect(callNextButton).not.toBeDisabled();
      expect(clearAllButton).not.toBeDisabled();
    });

    test('disables buttons when component is disabled', () => {
      render(<QueuePanel {...defaultProps} queueState={mockQueueState} disabled={true} />);
      
      const callNextButton = screen.getByRole('button', { name: /call next/i });
      const clearAllButton = screen.getByRole('button', { name: /clear all/i });
      
      expect(callNextButton).toBeDisabled();
      expect(clearAllButton).toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    test('calls onCallOnNext when call next button is clicked', async () => {
      const onCallOnNext = jest.fn().mockResolvedValue(undefined);
      
      render(<QueuePanel {...defaultProps} queueState={mockQueueState} onCallOnNext={onCallOnNext} />);
      
      const callNextButton = screen.getByRole('button', { name: /call next/i });
      fireEvent.click(callNextButton);
      
      await waitFor(() => {
        expect(onCallOnNext).toHaveBeenCalledWith('1', 'instructor-123');
      });
    });

    test('calls onLowerAll when clear all button is clicked', async () => {
      const onLowerAll = jest.fn().mockResolvedValue(undefined);
      
      render(<QueuePanel {...defaultProps} queueState={mockQueueState} onLowerAll={onLowerAll} />);
      
      const clearAllButton = screen.getByRole('button', { name: /clear all/i });
      fireEvent.click(clearAllButton);
      
      await waitFor(() => {
        expect(onLowerAll).toHaveBeenCalledWith('1', 'instructor-123');
      });
    });

    test('calls onLowerIndividual when individual lower button is clicked', async () => {
      const onLowerIndividual = jest.fn().mockResolvedValue(undefined);
      
      render(<QueuePanel {...defaultProps} queueState={mockQueueState} onLowerIndividual={onLowerIndividual} />);
      
      // Find the X button for John Doe (first participant)
      const lowerButtons = screen.getAllByRole('button');
      const johnDoeLowerButton = lowerButtons.find(button => 
        button.getAttribute('title')?.includes("John Doe's hand")
      );
      
      expect(johnDoeLowerButton).toBeInTheDocument();
      fireEvent.click(johnDoeLowerButton!);
      
      await waitFor(() => {
        expect(onLowerIndividual).toHaveBeenCalledWith('1', 'instructor-123', 'participant-123');
      });
    });

    test('shows loading state during API calls', async () => {
      const onCallOnNext = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<QueuePanel {...defaultProps} queueState={mockQueueState} onCallOnNext={onCallOnNext} />);
      
      const callNextButton = screen.getByRole('button', { name: /call next/i });
      fireEvent.click(callNextButton);
      
      // Should show loading state
      expect(callNextButton).toHaveAttribute('disabled');
    });

    test('handles API call errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const onCallOnNext = jest.fn().mockRejectedValue(new Error('API Error'));
      
      render(<QueuePanel {...defaultProps} queueState={mockQueueState} onCallOnNext={onCallOnNext} />);
      
      const callNextButton = screen.getByRole('button', { name: /call next/i });
      fireEvent.click(callNextButton);
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Error calling on next participant:', expect.any(Error));
      });
      
      consoleError.mockRestore();
    });

    test('does not trigger actions when buttons are disabled', () => {
      const onCallOnNext = jest.fn();
      
      render(<QueuePanel {...defaultProps} disabled={true} onCallOnNext={onCallOnNext} />);
      
      const callNextButton = screen.getByRole('button', { name: /call next/i });
      fireEvent.click(callNextButton);
      
      expect(onCallOnNext).not.toHaveBeenCalled();
    });
  });

  describe('Queue Entry Display', () => {
    test('shows participant names and positions', () => {
      render(<QueuePanel {...defaultProps} queueState={mockQueueState} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    test('shows role badges for participants', () => {
      render(<QueuePanel {...defaultProps} queueState={mockQueueState} />);
      
      expect(screen.getByText('student')).toBeInTheDocument();
      expect(screen.getByText('instructor')).toBeInTheDocument();
    });

    test('formats time since hand raised', () => {
      render(<QueuePanel {...defaultProps} queueState={mockQueueState} />);
      
      // Should show "30s ago" and "1m 0s ago"
      expect(screen.getByText(/30s ago/)).toBeInTheDocument();
      expect(screen.getByText(/1m.*s ago/)).toBeInTheDocument();
    });

    test('shows correct queue subtitle with count', () => {
      render(<QueuePanel {...defaultProps} queueState={mockQueueState} />);
      
      expect(screen.getByText('2 participants waiting')).toBeInTheDocument();
    });

    test('shows zero count when queue is empty', () => {
      const emptyQueueState: QueueState = {
        classroomId: '1',
        entries: [],
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: new Date(),
        isActive: true
      };

      render(<QueuePanel {...defaultProps} queueState={emptyQueueState} />);
      
      expect(screen.getByText('0 participants waiting')).toBeInTheDocument();
    });
  });

  describe('Time Formatting', () => {
    test('formats seconds correctly', () => {
      const recentEntry = {
        ...mockQueueEntry,
        raisedAt: new Date(Date.now() - 5000) // 5 seconds ago
      };

      const queueStateWithRecentEntry: QueueState = {
        ...mockQueueState,
        entries: [recentEntry]
      };

      render(<QueuePanel {...defaultProps} queueState={queueStateWithRecentEntry} />);
      
      expect(screen.getByText(/5s ago/)).toBeInTheDocument();
    });

    test('formats minutes and seconds correctly', () => {
      const olderEntry = {
        ...mockQueueEntry,
        raisedAt: new Date(Date.now() - 90000) // 1 minute 30 seconds ago
      };

      const queueStateWithOlderEntry: QueueState = {
        ...mockQueueState,
        entries: [olderEntry]
      };

      render(<QueuePanel {...defaultProps} queueState={queueStateWithOlderEntry} />);
      
      expect(screen.getByText(/1m.*s ago/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper button titles for individual lower actions', () => {
      render(<QueuePanel {...defaultProps} queueState={mockQueueState} />);
      
      const lowerButtons = screen.getAllByRole('button');
      const johnDoeLowerButton = lowerButtons.find(button => 
        button.getAttribute('title')?.includes("John Doe's hand")
      );
      
      expect(johnDoeLowerButton).toHaveAttribute('title', "Lower John Doe's hand");
    });

    test('has accessible role for buttons', () => {
      render(<QueuePanel {...defaultProps} queueState={mockQueueState} />);
      
      expect(screen.getByRole('button', { name: /call next/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
    });

    test('supports keyboard navigation', async () => {
      const onCallOnNext = jest.fn().mockResolvedValue(undefined);
      
      render(<QueuePanel {...defaultProps} queueState={mockQueueState} onCallOnNext={onCallOnNext} />);
      
      const callNextButton = screen.getByRole('button', { name: /call next/i });
      callNextButton.focus();
      
      fireEvent.keyDown(callNextButton, { key: 'Enter' });
      
      expect(onCallOnNext).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('handles null queue state gracefully', () => {
      render(<QueuePanel {...defaultProps} queueState={null} />);
      
      expect(screen.getByText('No hands raised')).toBeInTheDocument();
    });

    test('handles queue state with no entries', () => {
      const emptyQueueState: QueueState = {
        classroomId: '1',
        entries: [],
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: new Date(),
        isActive: true
      };

      render(<QueuePanel {...defaultProps} queueState={emptyQueueState} />);
      
      expect(screen.getByText('No hands raised')).toBeInTheDocument();
    });

    test('handles queue state with many entries', () => {
      const manyEntries = Array.from({ length: 10 }, (_, i) => ({
        id: `entry-${i}`,
        participantId: `participant-${i}`,
        participantName: `Participant ${i}`,
        classroomId: '1',
        raisedAt: new Date(Date.now() - (i * 1000)),
        position: i + 1,
        isActive: false,
        role: 'student' as const
      }));

      const largeQueueState: QueueState = {
        classroomId: '1',
        entries: manyEntries,
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: new Date(),
        isActive: true
      };

      render(<QueuePanel {...defaultProps} queueState={largeQueueState} />);
      
      expect(screen.getByText('10 participants waiting')).toBeInTheDocument();
      expect(screen.getByText('Participant 0')).toBeInTheDocument();
      expect(screen.getByText('Participant 9')).toBeInTheDocument();
    });

    test('handles loading state during multiple concurrent actions', async () => {
      const onCallOnNext = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      const onLowerAll = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(
        <QueuePanel 
          {...defaultProps} 
          queueState={mockQueueState} 
          onCallOnNext={onCallOnNext}
          onLowerAll={onLowerAll}
        />
      );
      
      const callNextButton = screen.getByRole('button', { name: /call next/i });
      const clearAllButton = screen.getByRole('button', { name: /clear all/i });
      
      // Click both buttons
      fireEvent.click(callNextButton);
      fireEvent.click(clearAllButton);
      
      // Both should be in loading state
      expect(callNextButton).toHaveAttribute('disabled');
      expect(clearAllButton).toHaveAttribute('disabled');
    });
  });

  describe('Real-time Updates', () => {
    test('updates when queue state changes', () => {
      const { rerender } = render(<QueuePanel {...defaultProps} />);
      
      expect(screen.getByText('No hands raised')).toBeInTheDocument();
      
      rerender(<QueuePanel {...defaultProps} queueState={mockQueueState} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('2 participants waiting')).toBeInTheDocument();
    });

    test('updates when active speaker changes', () => {
      const { rerender } = render(<QueuePanel {...defaultProps} />);
      
      expect(screen.queryByText('Currently Speaking')).not.toBeInTheDocument();
      
      rerender(<QueuePanel {...defaultProps} activeSpeaker={mockActiveSpeaker} />);
      
      expect(screen.getByText('Currently Speaking')).toBeInTheDocument();
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });
  });
});

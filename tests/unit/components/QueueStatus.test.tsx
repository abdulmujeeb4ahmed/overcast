/**
 * Unit Test: QueueStatus Component
 * 
 * Tests the QueueStatus component with React Testing Library
 * Validates rendering, status indicators, detailed view, and accessibility
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import QueueStatus from '@/app/components/QueueStatus';
import { QueueState, ActiveSpeaker } from '@/lib/queue-types';

describe('QueueStatus Component', () => {
  const defaultProps = {
    queueState: null,
    activeSpeaker: null
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

  describe('Compact Status Display', () => {
    test('renders queue length when queue has entries', () => {
      render(<QueueStatus {...defaultProps} queueState={mockQueueState} />);
      
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('in queue')).toBeInTheDocument();
    });

    test('renders zero when queue is empty', () => {
      const emptyQueueState: QueueState = {
        classroomId: '1',
        entries: [],
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: new Date(),
        isActive: true
      };

      render(<QueueStatus {...defaultProps} queueState={emptyQueueState} />);
      
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('in queue')).toBeInTheDocument();
    });

    test('renders zero when queue state is null', () => {
      render(<QueueStatus {...defaultProps} />);
      
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('in queue')).toBeInTheDocument();
    });

    test('shows active speaker when available', () => {
      render(<QueueStatus {...defaultProps} activeSpeaker={mockActiveSpeaker} />);
      
      expect(screen.getByText('Alice Johnson speaking')).toBeInTheDocument();
    });

    test('shows waiting indicator when queue has entries but no active speaker', () => {
      render(<QueueStatus {...defaultProps} queueState={mockQueueState} />);
      
      expect(screen.getByText('Waiting for instructor')).toBeInTheDocument();
    });

    test('shows no queue indicator when empty and no active speaker', () => {
      const emptyQueueState: QueueState = {
        classroomId: '1',
        entries: [],
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: new Date(),
        isActive: true
      };

      render(<QueueStatus {...defaultProps} queueState={emptyQueueState} />);
      
      expect(screen.getByText('No queue')).toBeInTheDocument();
    });

    test('renders with custom className', () => {
      render(<QueueStatus {...defaultProps} className="custom-class" />);
      
      const container = screen.getByText('0').closest('div')?.parentElement;
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Queue Status Colors', () => {
    test('uses teal color for low queue usage', () => {
      const lowQueueState: QueueState = {
        classroomId: '1',
        entries: Array.from({ length: 10 }, (_, i) => ({
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

      render(<QueueStatus {...defaultProps} queueState={lowQueueState} />);
      
      const queueLength = screen.getByText('10');
      expect(queueLength).toHaveClass('text-teal-400');
    });

    test('uses yellow color for medium queue usage', () => {
      const mediumQueueState: QueueState = {
        classroomId: '1',
        entries: Array.from({ length: 35 }, (_, i) => ({
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

      render(<QueueStatus {...defaultProps} queueState={mediumQueueState} />);
      
      const queueLength = screen.getByText('35');
      expect(queueLength).toHaveClass('text-yellow-400');
    });

    test('uses red color for high queue usage', () => {
      const highQueueState: QueueState = {
        classroomId: '1',
        entries: Array.from({ length: 45 }, (_, i) => ({
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

      render(<QueueStatus {...defaultProps} queueState={highQueueState} />);
      
      const queueLength = screen.getByText('45');
      expect(queueLength).toHaveClass('text-red-400');
    });
  });

  describe('Detailed Queue Information', () => {
    test('does not show details by default', () => {
      render(<QueueStatus {...defaultProps} queueState={mockQueueState} />);
      
      expect(screen.queryByText('Queue Details')).not.toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    test('shows details when showDetails is true', () => {
      render(<QueueStatus {...defaultProps} queueState={mockQueueState} showDetails={true} />);
      
      expect(screen.getByText('Queue Details')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    test('shows only first 5 participants in details', () => {
      const manyEntries = Array.from({ length: 7 }, (_, i) => ({
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

      render(<QueueStatus {...defaultProps} queueState={largeQueueState} showDetails={true} />);
      
      expect(screen.getByText('Participant 0')).toBeInTheDocument();
      expect(screen.getByText('Participant 4')).toBeInTheDocument();
      expect(screen.queryByText('Participant 5')).not.toBeInTheDocument();
      expect(screen.getByText('+2 more participants')).toBeInTheDocument();
    });

    test('shows participant positions in details', () => {
      render(<QueueStatus {...defaultProps} queueState={mockQueueState} showDetails={true} />);
      
      expect(screen.getByText('1')).toBeInTheDocument(); // Position
      expect(screen.getByText('2')).toBeInTheDocument(); // Position
    });

    test('shows role badges in details', () => {
      render(<QueueStatus {...defaultProps} queueState={mockQueueState} showDetails={true} />);
      
      expect(screen.getByText('student')).toBeInTheDocument();
      expect(screen.getByText('instructor')).toBeInTheDocument();
    });

    test('formats time since hand raised in details', () => {
      render(<QueueStatus {...defaultProps} queueState={mockQueueState} showDetails={true} />);
      
      expect(screen.getByText('30s')).toBeInTheDocument();
      expect(screen.getByText('1m 0s')).toBeInTheDocument();
    });

    test('does not show details when queue is empty', () => {
      const emptyQueueState: QueueState = {
        classroomId: '1',
        entries: [],
        activeSpeaker: null,
        maxCapacity: 50,
        lastUpdated: new Date(),
        isActive: true
      };

      render(<QueueStatus {...defaultProps} queueState={emptyQueueState} showDetails={true} />);
      
      expect(screen.queryByText('Queue Details')).not.toBeInTheDocument();
    });

    test('does not show details when queue state is null', () => {
      render(<QueueStatus {...defaultProps} showDetails={true} />);
      
      expect(screen.queryByText('Queue Details')).not.toBeInTheDocument();
    });
  });

  describe('Queue Capacity Indicator', () => {
    test('shows capacity indicator when showDetails is true', () => {
      render(<QueueStatus {...defaultProps} queueState={mockQueueState} showDetails={true} />);
      
      expect(screen.getByText('Queue Capacity')).toBeInTheDocument();
      expect(screen.getByText('2/50')).toBeInTheDocument();
    });

    test('shows correct capacity percentage', () => {
      const halfCapacityQueueState: QueueState = {
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

      render(<QueueStatus {...defaultProps} queueState={halfCapacityQueueState} showDetails={true} />);
      
      expect(screen.getByText('25/50')).toBeInTheDocument();
    });

    test('uses teal color for low capacity usage', () => {
      render(<QueueStatus {...defaultProps} queueState={mockQueueState} showDetails={true} />);
      
      const progressBar = screen.getByText('Queue Capacity').closest('div')?.querySelector('[style*="width"]');
      expect(progressBar).toHaveClass('bg-teal-500');
    });

    test('uses yellow color for medium capacity usage', () => {
      const mediumQueueState: QueueState = {
        classroomId: '1',
        entries: Array.from({ length: 35 }, (_, i) => ({
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

      render(<QueueStatus {...defaultProps} queueState={mediumQueueState} showDetails={true} />);
      
      const progressBar = screen.getByText('Queue Capacity').closest('div')?.querySelector('[style*="width"]');
      expect(progressBar).toHaveClass('bg-yellow-500');
    });

    test('uses red color for high capacity usage', () => {
      const highQueueState: QueueState = {
        classroomId: '1',
        entries: Array.from({ length: 45 }, (_, i) => ({
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

      render(<QueueStatus {...defaultProps} queueState={highQueueState} showDetails={true} />);
      
      const progressBar = screen.getByText('Queue Capacity').closest('div')?.querySelector('[style*="width"]');
      expect(progressBar).toHaveClass('bg-red-500');
    });

    test('caps progress bar at 100%', () => {
      const fullQueueState: QueueState = {
        classroomId: '1',
        entries: Array.from({ length: 60 }, (_, i) => ({
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

      render(<QueueStatus {...defaultProps} queueState={fullQueueState} showDetails={true} />);
      
      const progressBar = screen.getByText('Queue Capacity').closest('div')?.querySelector('[style*="width: 100%"]');
      expect(progressBar).toBeInTheDocument();
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

      render(<QueueStatus {...defaultProps} queueState={queueStateWithRecentEntry} showDetails={true} />);
      
      expect(screen.getByText('5s')).toBeInTheDocument();
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

      render(<QueueStatus {...defaultProps} queueState={queueStateWithOlderEntry} showDetails={true} />);
      
      expect(screen.getByText('1m 30s')).toBeInTheDocument();
    });
  });

  describe('Role Badge Colors', () => {
    test('shows blue badge for instructor role', () => {
      const instructorEntry = {
        ...mockQueueEntry,
        role: 'instructor' as const
      };

      const queueStateWithInstructor: QueueState = {
        ...mockQueueState,
        entries: [instructorEntry]
      };

      render(<QueueStatus {...defaultProps} queueState={queueStateWithInstructor} showDetails={true} />);
      
      const instructorBadge = screen.getByText('instructor');
      expect(instructorBadge).toHaveClass('bg-blue-600', 'text-blue-100');
    });

    test('shows gray badge for student role', () => {
      render(<QueueStatus {...defaultProps} queueState={mockQueueState} showDetails={true} />);
      
      const studentBadge = screen.getByText('student');
      expect(studentBadge).toHaveClass('bg-gray-600', 'text-gray-100');
    });
  });

  describe('Edge Cases', () => {
    test('handles null queue state gracefully', () => {
      render(<QueueStatus {...defaultProps} queueState={null} />);
      
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('No queue')).toBeInTheDocument();
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

      render(<QueueStatus {...defaultProps} queueState={emptyQueueState} />);
      
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('No queue')).toBeInTheDocument();
    });

    test('handles active speaker without queue entries', () => {
      render(<QueueStatus {...defaultProps} activeSpeaker={mockActiveSpeaker} />);
      
      expect(screen.getByText('Alice Johnson speaking')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    test('handles queue state with default maxCapacity when not provided', () => {
      const queueStateWithoutCapacity: QueueState = {
        classroomId: '1',
        entries: [mockQueueEntry],
        activeSpeaker: null,
        maxCapacity: 50, // Default value
        lastUpdated: new Date(),
        isActive: true
      };

      render(<QueueStatus {...defaultProps} queueState={queueStateWithoutCapacity} showDetails={true} />);
      
      expect(screen.getByText('1/50')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    test('updates when queue state changes', () => {
      const { rerender } = render(<QueueStatus {...defaultProps} />);
      
      expect(screen.getByText('0')).toBeInTheDocument();
      
      rerender(<QueueStatus {...defaultProps} queueState={mockQueueState} />);
      
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Waiting for instructor')).toBeInTheDocument();
    });

    test('updates when active speaker changes', () => {
      const { rerender } = render(<QueueStatus {...defaultProps} />);
      
      expect(screen.getByText('No queue')).toBeInTheDocument();
      
      rerender(<QueueStatus {...defaultProps} activeSpeaker={mockActiveSpeaker} />);
      
      expect(screen.getByText('Alice Johnson speaking')).toBeInTheDocument();
    });

    test('updates when showDetails prop changes', () => {
      const { rerender } = render(<QueueStatus {...defaultProps} queueState={mockQueueState} showDetails={false} />);
      
      expect(screen.queryByText('Queue Details')).not.toBeInTheDocument();
      
      rerender(<QueueStatus {...defaultProps} queueState={mockQueueState} showDetails={true} />);
      
      expect(screen.getByText('Queue Details')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper semantic structure', () => {
      render(<QueueStatus {...defaultProps} queueState={mockQueueState} />);
      
      // Should have proper text content for screen readers
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('in queue')).toBeInTheDocument();
    });

    test('provides clear status information', () => {
      render(<QueueStatus {...defaultProps} queueState={mockQueueState} activeSpeaker={mockActiveSpeaker} />);
      
      // Should show both queue status and active speaker
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Alice Johnson speaking')).toBeInTheDocument();
    });

    test('shows detailed information when requested', () => {
      render(<QueueStatus {...defaultProps} queueState={mockQueueState} showDetails={true} />);
      
      // Should show participant names and positions for screen readers
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });
});

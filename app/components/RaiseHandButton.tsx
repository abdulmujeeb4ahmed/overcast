'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui';
import { QueueState } from '@/lib/queue-types';
import { isParticipantInQueue, findQueueEntry } from '@/lib/queue-utils';

interface RaiseHandButtonProps {
  /** Classroom ID */
  classroomId: string;
  /** Participant ID */
  participantId: string;
  /** Participant name */
  participantName: string;
  /** Participant role */
  role: 'student' | 'instructor';
  /** Current queue state */
  queueState: QueueState | null;
  /** Callback when hand is raised */
  onRaiseHand: (classroomId: string, participantId: string, participantName: string, role: 'student' | 'instructor') => Promise<void>;
  /** Callback when hand is lowered */
  onLowerHand: (classroomId: string, participantId: string) => Promise<void>;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * RaiseHandButton Component
 * 
 * Interactive button for participants to raise/lower their hand in the speaking queue.
 * Shows current queue position when hand is raised and provides visual feedback.
 * 
 * Features:
 * - Toggle between raised/lowered states
 * - Shows queue position when raised
 * - Loading states during API calls
 * - Accessibility support with ARIA labels
 * - Real-time updates based on queue state
 */
export default function RaiseHandButton({
  classroomId,
  participantId,
  participantName,
  role,
  queueState,
  onRaiseHand,
  onLowerHand,
  disabled = false,
  className
}: RaiseHandButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);

  // Update local state based on queue state
  useEffect(() => {
    if (!queueState) {
      setIsHandRaised(false);
      setQueuePosition(null);
      return;
    }

    const isInQueue = isParticipantInQueue(queueState, participantId);
    setIsHandRaised(isInQueue);

    if (isInQueue) {
      const entry = findQueueEntry(queueState, participantId);
      setQueuePosition(entry?.position || null);
    } else {
      setQueuePosition(null);
    }
  }, [queueState, participantId]);

  // Handle raise/lower hand action
  const handleToggleHand = async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);
    try {
      if (isHandRaised) {
        await onLowerHand(classroomId, participantId);
      } else {
        await onRaiseHand(classroomId, participantId, participantName, role);
      }
    } catch (error) {
      console.error('Error toggling hand:', error);
      // Error handling could be improved with toast notifications
    } finally {
      setIsLoading(false);
    }
  };

  // Determine button text and icon
  const getButtonContent = () => {
    if (isLoading) {
      return 'Loading...';
    }

    if (isHandRaised && queuePosition) {
      return `Position ${queuePosition}`;
    }

    return isHandRaised ? 'Lower Hand' : 'Raise Hand';
  };

  // Determine button variant
  const getButtonVariant = (): 'primary' | 'secondary' | 'success' => {
    if (isLoading) return 'secondary';
    if (isHandRaised) return 'success';
    return 'primary';
  };

  // Hand icon component
  const HandIcon = ({ raised }: { raised: boolean }) => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {raised ? (
        // Raised hand icon
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
        />
      ) : (
        // Lowered hand icon
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
        />
      )}
    </svg>
  );

  return (
    <Button
      variant={getButtonVariant()}
      size="md"
      loading={isLoading}
      disabled={disabled}
      onClick={handleToggleHand}
      icon={<HandIcon raised={isHandRaised} />}
      className={className}
      aria-label={
        isHandRaised
          ? `Lower hand (currently position ${queuePosition} in queue)`
          : 'Raise hand to join speaking queue'
      }
      title={
        isHandRaised
          ? `You are position ${queuePosition} in the speaking queue. Click to lower your hand.`
          : 'Click to raise your hand and join the speaking queue.'
      }
    >
      {getButtonContent()}
    </Button>
  );
}

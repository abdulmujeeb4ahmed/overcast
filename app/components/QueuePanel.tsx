'use client';

import React, { useState } from 'react';
import { Button, Card } from './ui';
import { QueueState, ActiveSpeaker } from '@/lib/queue-types';

interface QueuePanelProps {
  /** Classroom ID */
  classroomId: string;
  /** Current queue state */
  queueState: QueueState | null;
  /** Current active speaker */
  activeSpeaker: ActiveSpeaker | null;
  /** Instructor ID */
  instructorId: string;
  /** Callback to call on next participant */
  onCallOnNext: (classroomId: string, instructorId: string) => Promise<void>;
  /** Callback to lower individual participant's hand */
  onLowerIndividual: (classroomId: string, instructorId: string, participantId: string) => Promise<void>;
  /** Callback to lower all hands */
  onLowerAll: (classroomId: string, instructorId: string) => Promise<void>;
  /** Whether the panel is disabled */
  disabled?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * QueuePanel Component
 * 
 * Instructor control panel for managing the speaking queue.
 * Provides controls to call on participants, lower individual hands, and clear the queue.
 * 
 * Features:
 * - Display current queue with participant names and positions
 * - Call on next participant button
 * - Lower individual participant hands
 * - Clear entire queue
 * - Show active speaker information
 * - Loading states for all actions
 * - Accessibility support
 */
export default function QueuePanel({
  classroomId,
  queueState,
  activeSpeaker,
  instructorId,
  onCallOnNext,
  onLowerIndividual,
  onLowerAll,
  disabled = false,
  className
}: QueuePanelProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Handle calling on next participant
  const handleCallOnNext = async () => {
    if (isLoading || disabled || !queueState || queueState.entries.length === 0) return;

    setIsLoading('call-on-next');
    try {
      await onCallOnNext(classroomId, instructorId);
    } catch (error) {
      console.error('Error calling on next participant:', error);
    } finally {
      setIsLoading(null);
    }
  };

  // Handle lowering individual participant's hand
  const handleLowerIndividual = async (participantId: string) => {
    if (isLoading || disabled) return;

    setIsLoading(`lower-${participantId}`);
    try {
      await onLowerIndividual(classroomId, instructorId, participantId);
    } catch (error) {
      console.error('Error lowering individual hand:', error);
    } finally {
      setIsLoading(null);
    }
  };

  // Handle lowering all hands
  const handleLowerAll = async () => {
    if (isLoading || disabled || !queueState || queueState.entries.length === 0) return;

    setIsLoading('lower-all');
    try {
      await onLowerAll(classroomId, instructorId);
    } catch (error) {
      console.error('Error lowering all hands:', error);
    } finally {
      setIsLoading(null);
    }
  };

  // Format time since hand was raised
  const formatTimeSince = (raisedAt: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - raisedAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);

    if (diffMins > 0) {
      return `${diffMins}m ${diffSecs}s ago`;
    }
    return `${diffSecs}s ago`;
  };

  // Get participant role badge color
  const getRoleBadgeColor = (role: 'student' | 'instructor'): string => {
    return role === 'instructor' 
      ? 'bg-blue-600 text-blue-100' 
      : 'bg-gray-600 text-gray-100';
  };

  return (
    <div className={className}>
      {/* Active Speaker Section */}
      {activeSpeaker && (
        <Card 
          title="Currently Speaking" 
          variant="classroom"
          className="mb-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="text-white font-medium">{activeSpeaker.participantName}</p>
                <p className="text-sm text-gray-400">
                  Called {formatTimeSince(activeSpeaker.calledAt)}
                </p>
              </div>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(activeSpeaker.role)}`}>
              {activeSpeaker.role}
            </span>
          </div>
        </Card>
      )}

      {/* Queue Management Section */}
      <Card 
        title="Speaking Queue" 
        subtitle={`${queueState?.entries.length || 0} participants waiting`}
        variant="classroom"
        headerActions={
          <div className="flex space-x-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleCallOnNext}
              disabled={disabled || !queueState || queueState.entries.length === 0 || isLoading !== null}
              loading={isLoading === 'call-on-next'}
            >
              Call Next
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleLowerAll}
              disabled={disabled || !queueState || queueState.entries.length === 0 || isLoading !== null}
              loading={isLoading === 'lower-all'}
            >
              Clear All
            </Button>
          </div>
        }
      >
        {!queueState || queueState.entries.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
              </svg>
            </div>
            <p className="text-gray-400">No hands raised</p>
            <p className="text-sm text-gray-500 mt-1">Participants will appear here when they raise their hands</p>
          </div>
        ) : (
          <div className="space-y-3">
            {queueState.entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-teal-600 text-white text-sm font-semibold rounded-full">
                    {entry.position}
                  </div>
                  <div>
                    <p className="text-white font-medium">{entry.participantName}</p>
                    <p className="text-sm text-gray-400">
                      Raised {formatTimeSince(entry.raisedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(entry.role)}`}>
                    {entry.role}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLowerIndividual(entry.participantId)}
                    disabled={disabled || isLoading !== null}
                    loading={isLoading === `lower-${entry.participantId}`}
                    className="text-gray-400 hover:text-red-400"
                    title={`Lower ${entry.participantName}'s hand`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Queue Statistics */}
      {queueState && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <p className="text-sm text-gray-400">Queue Length</p>
            <p className="text-2xl font-bold text-white">{queueState.entries.length}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <p className="text-sm text-gray-400">Max Capacity</p>
            <p className="text-2xl font-bold text-white">{queueState.maxCapacity}</p>
          </div>
        </div>
      )}
    </div>
  );
}

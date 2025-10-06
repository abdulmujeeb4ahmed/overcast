'use client';

import React from 'react';
import { QueueState, ActiveSpeaker } from '@/lib/queue-types';

interface QueueStatusProps {
  /** Current queue state */
  queueState: QueueState | null;
  /** Current active speaker */
  activeSpeaker: ActiveSpeaker | null;
  /** Whether to show detailed information */
  showDetails?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * QueueStatus Component
 * 
 * Compact status display for the speaking queue.
 * Shows current queue length, active speaker, and optionally detailed queue information.
 * Designed to be embedded in participant lists or other UI components.
 * 
 * Features:
 * - Compact queue length display
 * - Active speaker indicator
 * - Optional detailed queue view
 * - Real-time updates
 * - Accessibility support
 */
export default function QueueStatus({
  queueState,
  activeSpeaker,
  showDetails = false,
  className
}: QueueStatusProps) {
  // Format time since hand was raised
  const formatTimeSince = (raisedAt: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - raisedAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);

    if (diffMins > 0) {
      return `${diffMins}m ${diffSecs}s`;
    }
    return `${diffSecs}s`;
  };

  // Get queue status color based on length
  const getQueueStatusColor = (length: number, maxCapacity: number): string => {
    const percentage = (length / maxCapacity) * 100;
    if (percentage >= 80) return 'text-red-400';
    if (percentage >= 60) return 'text-yellow-400';
    return 'text-teal-400';
  };

  // Get participant role badge color
  const getRoleBadgeColor = (role: 'student' | 'instructor'): string => {
    return role === 'instructor' 
      ? 'bg-blue-600 text-blue-100' 
      : 'bg-gray-600 text-gray-100';
  };

  const queueLength = queueState?.entries.length || 0;
  const maxCapacity = queueState?.maxCapacity || 50;

  return (
    <div className={className}>
      {/* Compact Status Display */}
      <div className="flex items-center space-x-4">
        {/* Queue Length */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
            </svg>
            <span className={`text-sm font-medium ${getQueueStatusColor(queueLength, maxCapacity)}`}>
              {queueLength}
            </span>
          </div>
          <span className="text-xs text-gray-500">in queue</span>
        </div>

        {/* Active Speaker Indicator */}
        {activeSpeaker && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">
              {activeSpeaker.participantName} speaking
            </span>
          </div>
        )}

        {/* Queue Status Indicator */}
        {!activeSpeaker && queueLength > 0 && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-300">Waiting for instructor</span>
          </div>
        )}

        {!activeSpeaker && queueLength === 0 && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <span className="text-sm text-gray-500">No queue</span>
          </div>
        )}
      </div>

      {/* Detailed Queue Information */}
      {showDetails && queueState && queueState.entries.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Queue Details</div>
          <div className="space-y-1">
            {queueState.entries.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between text-sm bg-gray-800 rounded px-2 py-1"
              >
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 bg-teal-600 text-white text-xs rounded-full flex items-center justify-center">
                    {entry.position}
                  </span>
                  <span className="text-gray-300">{entry.participantName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-1.5 py-0.5 text-xs rounded ${getRoleBadgeColor(entry.role)}`}>
                    {entry.role}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTimeSince(entry.raisedAt)}
                  </span>
                </div>
              </div>
            ))}
            {queueState.entries.length > 5 && (
              <div className="text-xs text-gray-500 text-center py-1">
                +{queueState.entries.length - 5} more participants
              </div>
            )}
          </div>
        </div>
      )}

      {/* Queue Capacity Indicator */}
      {showDetails && queueState && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Queue Capacity</span>
            <span>{queueLength}/{maxCapacity}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                queueLength >= maxCapacity * 0.8
                  ? 'bg-red-500'
                  : queueLength >= maxCapacity * 0.6
                  ? 'bg-yellow-500'
                  : 'bg-teal-500'
              }`}
              style={{ width: `${Math.min((queueLength / maxCapacity) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}

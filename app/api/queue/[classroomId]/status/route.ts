/**
 * GET /api/queue/{classroomId}/status endpoint
 * 
 * Returns the current state of the queue for a classroom including:
 * - Ordered list of queue entries
 * - Current active speaker (if any)
 * - Queue capacity and metadata
 * 
 * WHY: Provides real-time queue status for both participants and instructors.
 * Used by UI components to display current queue state and enable proper
 * queue management functionality.
 */

import { getQueueState } from '@/lib/queue-state';
import { 
  RouteParams, 
  memoizedValidateClassroomId,
  ERROR_RESPONSES,
  createSuccessResponse
} from '@/lib/queue-api-utils';

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { classroomId } = await params;

    // Validate classroom ID (using memoized version for performance)
    if (!memoizedValidateClassroomId(classroomId)) {
      return ERROR_RESPONSES.INVALID_CLASSROOM_ID();
    }

    try {
      // Get current queue state
      const queueState = getQueueState(classroomId);

      // Return the queue status
      return createSuccessResponse(queueState);
    } catch (error) {
      console.error('Error getting queue state:', error);
      return ERROR_RESPONSES.INTERNAL_ERROR('Failed to retrieve queue status');
    }
  } catch (error) {
    console.error('Error in GET /api/queue/[classroomId]/status:', error);
    return ERROR_RESPONSES.INTERNAL_ERROR('Failed to process status request');
  }
}

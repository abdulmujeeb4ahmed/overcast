/**
 * POST /api/queue/{classroomId}/call-on endpoint
 * 
 * Allows instructors to call on the next participant in the queue to speak.
 * Validates instructor permissions and that there are participants in the queue.
 * 
 * WHY: Core functionality for instructors to manage speaking order in live classes.
 * Follows FIFO (first in, first out) queue ordering for fair speaking opportunities.
 */

import { callOnNextParticipant, getQueueState } from '@/lib/queue-state';
import { 
  RouteParams, 
  BaseRequest, 
  processQueueRequest,
  validateBaseRequest,
  validateInstructorPermissions
} from '@/lib/queue-api-utils';

interface CallOnRequest extends BaseRequest {
  instructorId: string;
}

/**
 * Validates call-on request body
 */
function validateCallOnRequest(body: unknown): body is CallOnRequest {
  if (!validateBaseRequest(body)) return false;
  
  const request = body as CallOnRequest;
  return validateInstructorPermissions(request.instructorId);
}

export async function POST(request: Request, { params }: RouteParams) {
  return processQueueRequest(
    request,
    { params },
    validateCallOnRequest,
    async (classroomId: string, body: BaseRequest) => {
      const { instructorId } = body as CallOnRequest;

      // Check if there are participants in the queue
      const currentState = getQueueState(classroomId);
      if (currentState.entries.length === 0) {
        throw new Error('No participants in queue to call on');
      }

      // Check if there's already an active speaker
      if (currentState.activeSpeaker) {
        throw new Error('There is already an active speaker');
      }

      // Call on the next participant
      const { activeSpeaker } = callOnNextParticipant(
        classroomId,
        instructorId
      );

      // Find the queue entry that was called on
      const calledOnEntry = currentState.entries[0]; // First in queue before removal

      return {
        success: true,
        activeSpeaker,
        queueEntry: calledOnEntry
      };
    }
  );
}

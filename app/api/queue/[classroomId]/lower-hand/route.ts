/**
 * POST /api/queue/{classroomId}/lower-hand endpoint
 * 
 * Allows participants to lower their hand and remove themselves from the speaking queue.
 * Validates participant is in queue before removing them.
 * 
 * WHY: Allows participants to voluntarily remove themselves from the queue if they
 * no longer want to speak or made a mistake when raising their hand.
 */

import { removeFromQueue, getQueueState } from '@/lib/queue-state';
import { isParticipantInQueue } from '@/lib/queue-utils';
import { 
  RouteParams, 
  BaseRequest, 
  processQueueRequest,
  validateBaseRequest,
  validateParticipantId
} from '@/lib/queue-api-utils';

interface LowerHandRequest extends BaseRequest {
  participantId: string;
}

/**
 * Validates lower hand request body
 */
function validateLowerHandRequest(body: unknown): body is LowerHandRequest {
  if (!validateBaseRequest(body)) return false;
  
  const request = body as LowerHandRequest;
  return validateParticipantId(request.participantId);
}

export async function POST(request: Request, { params }: RouteParams) {
  return processQueueRequest(
    request,
    { params },
    validateLowerHandRequest,
    async (classroomId: string, body: BaseRequest) => {
      const { participantId } = body as LowerHandRequest;

      // Check if participant is in queue
      const currentState = getQueueState(classroomId);
      if (!isParticipantInQueue(currentState, participantId)) {
        throw new Error('Participant not found in queue');
      }

      // Remove participant from queue
      removeFromQueue(classroomId, participantId);

      return {
        success: true,
        message: 'Hand lowered successfully'
      };
    }
  );
}

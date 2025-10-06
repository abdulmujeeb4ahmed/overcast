/**
 * POST /api/queue/{classroomId}/lower-individual endpoint
 * 
 * Allows instructors to lower a specific participant's hand and remove them from the queue.
 * Validates instructor permissions and that the participant is in the queue.
 * 
 * WHY: Gives instructors control to manage the queue by removing specific participants
 * who may have raised their hand inappropriately or no longer need to speak.
 */

import { removeFromQueue, getQueueState } from '@/lib/queue-state';
import { isParticipantInQueue } from '@/lib/queue-utils';
import { 
  RouteParams, 
  BaseRequest, 
  processQueueRequest,
  validateBaseRequest,
  validateInstructorPermissions,
  validateParticipantId
} from '@/lib/queue-api-utils';

interface LowerIndividualRequest extends BaseRequest {
  instructorId: string;
  participantId: string;
}

/**
 * Validates lower-individual request body
 */
function validateLowerIndividualRequest(body: unknown): body is LowerIndividualRequest {
  if (!validateBaseRequest(body)) return false;
  
  const request = body as LowerIndividualRequest;
  return (
    validateInstructorPermissions(request.instructorId) &&
    validateParticipantId(request.participantId)
  );
}

export async function POST(request: Request, { params }: RouteParams) {
  return processQueueRequest(
    request,
    { params },
    validateLowerIndividualRequest,
    async (classroomId: string, body: BaseRequest) => {
      const { participantId } = body as LowerIndividualRequest;

      // Check if participant is in queue
      const currentState = getQueueState(classroomId);
      if (!isParticipantInQueue(currentState, participantId)) {
        throw new Error('Participant not found in queue');
      }

      // Remove participant from queue
      removeFromQueue(classroomId, participantId);

      return {
        success: true,
        message: 'Participant hand lowered'
      };
    }
  );
}

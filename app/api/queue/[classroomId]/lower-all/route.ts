/**
 * POST /api/queue/{classroomId}/lower-all endpoint
 * 
 * Allows instructors to lower all hands and clear the entire queue.
 * Validates instructor permissions and clears both queue entries and active speaker.
 * 
 * WHY: Gives instructors the ability to reset the queue completely, useful for
 * transitioning between topics, handling disruptions, or starting fresh discussions.
 */

import { lowerAllHands, getQueueState } from '@/lib/queue-state';
import { 
  RouteParams, 
  BaseRequest, 
  processQueueRequest,
  validateBaseRequest,
  validateInstructorPermissions
} from '@/lib/queue-api-utils';

interface LowerAllRequest extends BaseRequest {
  instructorId: string;
}

/**
 * Validates lower-all request body
 */
function validateLowerAllRequest(body: unknown): body is LowerAllRequest {
  if (!validateBaseRequest(body)) return false;
  
  const request = body as LowerAllRequest;
  return validateInstructorPermissions(request.instructorId);
}

export async function POST(request: Request, { params }: RouteParams) {
  return processQueueRequest(
    request,
    { params },
    validateLowerAllRequest,
    async (classroomId: string, _body: BaseRequest) => {

      // Get current state to count hands before clearing
      const currentState = getQueueState(classroomId);
      const loweredCount = currentState.entries.length;

      // Lower all hands and clear queue
      lowerAllHands(classroomId);

      return {
        success: true,
        loweredCount,
        message: 'All hands lowered'
      };
    }
  );
}

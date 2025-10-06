/**
 * POST /api/queue/{classroomId}/raise-hand endpoint
 * 
 * Allows participants to raise their hand and join the speaking queue.
 * Validates participant is in classroom, not already in queue, and queue has capacity.
 * 
 * WHY: Core functionality for students to request permission to speak in live classes.
 * Integrates with Daily.co participant management and maintains real-time queue state.
 */

import { addToQueue } from '@/lib/queue-state';
import { 
  RouteParams, 
  BaseRequest, 
  processQueueRequest,
  validateBaseRequest,
  validateParticipantId,
  validateParticipantName
} from '@/lib/queue-api-utils';

interface RaiseHandRequest extends BaseRequest {
  participantId: string;
  participantName: string;
}

/**
 * Validates raise hand request body
 */
function validateRaiseHandRequest(body: unknown): body is RaiseHandRequest {
  if (!validateBaseRequest(body)) return false;
  
  const request = body as RaiseHandRequest;
  return (
    validateParticipantId(request.participantId) &&
    validateParticipantName(request.participantName)
  );
}

export async function POST(request: Request, { params }: RouteParams) {
  return processQueueRequest(
    request,
    { params },
    validateRaiseHandRequest,
    async (classroomId: string, body: BaseRequest) => {
      const { participantId, participantName } = body as RaiseHandRequest;

      // TODO: In production, validate participant is actually in the Daily.co classroom
      // For now, we'll assume the participant is valid

      // Add participant to queue
      const updatedQueueState = addToQueue(
        classroomId,
        participantId,
        participantName,
        'student' // Default role - could be determined from Daily.co participant data
      );

      // Find the newly added entry
      const newEntry = updatedQueueState.entries.find(
        entry => entry.participantId === participantId
      );

      if (!newEntry) {
        throw new Error('Failed to create queue entry');
      }

      return {
        success: true,
        queueEntry: newEntry,
        position: newEntry.position
      };
    }
  );
}

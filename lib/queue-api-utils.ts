// queue-api-utils.ts - Shared utilities for queue API endpoints
// WHY: Eliminates code duplication across all queue API routes and provides
// consistent validation, error handling, and response formatting.

import { NextResponse } from 'next/server';
import { QueueError } from './queue-types';

// Common interfaces
export interface RouteParams {
  params: Promise<{
    classroomId: string;
  }>;
}

export interface BaseRequest {
  participantId?: string;
  instructorId?: string;
  participantName?: string;
}

// Validation functions
export function validateClassroomId(classroomId: string): boolean {
  return /^[1-6]$/.test(classroomId);
}

export function validateInstructorPermissions(instructorId: string): boolean {
  // TODO: In production, verify instructor role from Daily.co participant data
  // For now, we'll accept any valid participant ID as an instructor
  return typeof instructorId === 'string' && instructorId.length > 0;
}

export function validateParticipantId(participantId: string): boolean {
  return typeof participantId === 'string' && participantId.length > 0;
}

export function validateParticipantName(participantName: string): boolean {
  return typeof participantName === 'string' && 
         participantName.length > 0 && 
         participantName.length <= 50;
}

// Request body validation
export function validateBaseRequest(body: unknown): body is BaseRequest {
  if (!body || typeof body !== 'object') return false;
  
  const request = body as Record<string, unknown>;
  
  // Check for required fields based on what's present
  if (request.participantId !== undefined && !validateParticipantId(request.participantId as string)) {
    return false;
  }
  
  if (request.instructorId !== undefined && !validateInstructorPermissions(request.instructorId as string)) {
    return false;
  }
  
  if (request.participantName !== undefined && !validateParticipantName(request.participantName as string)) {
    return false;
  }
  
  return true;
}

// Error response helpers
export function createErrorResponse(
  error: string,
  message: string,
  code: string,
  status: number
): NextResponse {
  return NextResponse.json(
    {
      error,
      message,
      code
    } as QueueError,
    { status }
  );
}

export function createSuccessResponse(data: unknown): NextResponse {
  return NextResponse.json(data);
}

// Common error responses
export const ERROR_RESPONSES = {
  INVALID_CLASSROOM_ID: () => createErrorResponse(
    'Bad Request',
    'Invalid classroom ID. Must be between 1 and 6.',
    'INVALID_CLASSROOM_ID',
    400
  ),
  
  INVALID_JSON: () => createErrorResponse(
    'Bad Request',
    'Invalid JSON in request body',
    'INVALID_JSON',
    400
  ),
  
  INVALID_REQUEST_BODY: (message: string) => createErrorResponse(
    'Bad Request',
    message,
    'INVALID_REQUEST_BODY',
    400
  ),
  
  INSUFFICIENT_PERMISSIONS: (action: string) => createErrorResponse(
    'Forbidden',
    `Only instructors can ${action}`,
    'INSUFFICIENT_PERMISSIONS',
    403
  ),
  
  PARTICIPANT_NOT_IN_QUEUE: () => createErrorResponse(
    'Not Found',
    'Participant not found in queue',
    'PARTICIPANT_NOT_IN_QUEUE',
    404
  ),
  
  NO_PARTICIPANTS_IN_QUEUE: () => createErrorResponse(
    'Not Found',
    'No participants in queue to call on',
    'NO_PARTICIPANTS_IN_QUEUE',
    404
  ),
  
  ALREADY_IN_QUEUE: () => createErrorResponse(
    'Bad Request',
    'Participant already in queue',
    'ALREADY_IN_QUEUE',
    400
  ),
  
  QUEUE_AT_CAPACITY: () => createErrorResponse(
    'Conflict',
    'Queue is at maximum capacity',
    'QUEUE_AT_CAPACITY',
    409
  ),
  
  QUEUE_NOT_ACTIVE: () => createErrorResponse(
    'Bad Request',
    'Queue is not currently accepting new entries',
    'QUEUE_NOT_ACTIVE',
    400
  ),
  
  ALREADY_ACTIVE_SPEAKER: () => createErrorResponse(
    'Bad Request',
    'There is already an active speaker',
    'ALREADY_ACTIVE_SPEAKER',
    400
  ),
  
  INTERNAL_ERROR: (message: string) => createErrorResponse(
    'Internal Server Error',
    message,
    'INTERNAL_ERROR',
    500
  )
};

// Common request processing
export async function processQueueRequest(
  request: Request,
  params: RouteParams,
  validateRequest: (body: unknown) => boolean,
  processAction: (classroomId: string, body: BaseRequest) => Promise<unknown>
): Promise<NextResponse> {
  try {
    const { classroomId } = await params.params;

    // Validate classroom ID
    if (!validateClassroomId(classroomId)) {
      return ERROR_RESPONSES.INVALID_CLASSROOM_ID();
    }

    // Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return ERROR_RESPONSES.INVALID_JSON();
    }

    if (!validateRequest(requestBody)) {
      return ERROR_RESPONSES.INVALID_REQUEST_BODY(
        'Invalid request body format'
      );
    }

    // Process the action
    const result = await processAction(classroomId, requestBody as BaseRequest);
    return createSuccessResponse(result);

  } catch (error) {
    console.error('Error in queue request processing:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Handle specific queue errors
    if (errorMessage.includes('already in queue')) {
      return ERROR_RESPONSES.ALREADY_IN_QUEUE();
    }
    
    if (errorMessage.includes('at capacity')) {
      return ERROR_RESPONSES.QUEUE_AT_CAPACITY();
    }
    
    if (errorMessage.includes('not active')) {
      return ERROR_RESPONSES.QUEUE_NOT_ACTIVE();
    }
    
    if (errorMessage.includes('No participants in queue')) {
      return ERROR_RESPONSES.NO_PARTICIPANTS_IN_QUEUE();
    }
    
    if (errorMessage.includes('already an active speaker')) {
      return ERROR_RESPONSES.ALREADY_ACTIVE_SPEAKER();
    }
    
    if (errorMessage.includes('not found in queue')) {
      return ERROR_RESPONSES.PARTICIPANT_NOT_IN_QUEUE();
    }

    // Generic error
    return ERROR_RESPONSES.INTERNAL_ERROR('Failed to process request');
  }
}

// Performance optimization: Memoized validation functions
const validationCache = new Map<string, boolean>();

export function memoizedValidateClassroomId(classroomId: string): boolean {
  if (validationCache.has(classroomId)) {
    return validationCache.get(classroomId)!;
  }
  
  const isValid = validateClassroomId(classroomId);
  validationCache.set(classroomId, isValid);
  return isValid;
}

// Cache cleanup (call periodically in production)
export function clearValidationCache(): void {
  validationCache.clear();
}

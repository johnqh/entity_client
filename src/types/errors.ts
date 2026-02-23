/**
 * @fileoverview Error handling types for entity API operations
 */

/**
 * Standard error codes returned by the entity API.
 */
export enum EntityErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  CONFLICT = 'CONFLICT',
  FORBIDDEN = 'FORBIDDEN',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Typed error response from the entity API.
 */
export interface EntityApiError {
  /** Machine-readable error code */
  code: EntityErrorCode;
  /** Human-readable error message */
  message: string;
}

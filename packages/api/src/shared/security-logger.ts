/**
 * Security event logging utility
 * Logs security-related events for monitoring and alerting
 */

export type SecurityEventType =
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'
  | 'CROSS_TEAM_ACCESS_ATTEMPT'
  | 'INVALID_CSRF_TOKEN'
  | 'RATE_LIMIT_EXCEEDED'
  | 'PAYLOAD_TOO_LARGE'
  | 'REGISTRATION_RACE_CONDITION';

export interface SecurityEventDetails {
  userId?: string;
  teamId?: string;
  eventId?: string;
  registrationId?: string;
  reason: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log a security event
 * In production, this should send to a security monitoring service
 */
export const logSecurityEvent = (
  event: SecurityEventType,
  details: SecurityEventDetails
): void => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ...details,
  };

  // Log to console for now
  // In production, send to security monitoring service (e.g., Sentry, DataDog)
  console.warn(`[SECURITY] ${event}`, logEntry);

  // TODO: Send to security monitoring service
  // await sendToSecurityMonitoring(logEntry);
};

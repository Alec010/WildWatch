import type { IncidentResponseDto } from '../features/incidents/models/IncidentModels';
import type { IncidentDetailsDto } from '../features/incidents/models/IncidentDetails';

/**
 * Determines if a reporter should be displayed as anonymous
 * This respects the current anonymity status as set by office admins
 */
export function isReporterAnonymous(incident: IncidentResponseDto | IncidentDetailsDto): boolean {
  // If submittedByFullName is null/undefined, it's anonymous
  if (!incident.submittedByFullName) {
    return true;
  }
  
  // Check the current preferAnonymous status (office admins can change this)
  if ('preferAnonymous' in incident) {
    return incident.preferAnonymous;
  }
  
  // Fallback: Check for anonymous patterns in the name
  const anonymousPatterns = [
    /^anonymous$/i,
    /^anon$/i,
    /^anonymous reporter$/i,
    /^anon reporter$/i,
    /^anonymous user$/i,
    /^anon user$/i,
  ];
  
  if (anonymousPatterns.some(pattern => pattern.test(incident.submittedByFullName || ''))) {
    return true;
  }
  
  // Additional check: if email is null/undefined but name exists,
  // it might be an anonymous report
  if (!incident.submittedByEmail && incident.submittedByFullName) {
    return true;
  }
  
  return false;
}

/**
 * Gets the display name for a reporter, handling anonymous cases
 */
export function getReporterDisplayName(incident: IncidentResponseDto | IncidentDetailsDto): string {
  if (isReporterAnonymous(incident)) {
    return 'Anonymous';
  }
  
  return incident.submittedByFullName || 'Anonymous';
}

/**
 * Gets the display email for a reporter, handling anonymous cases
 */
export function getReporterDisplayEmail(incident: IncidentResponseDto | IncidentDetailsDto): string {
  if (isReporterAnonymous(incident)) {
    return 'Not provided';
  }
  
  return incident.submittedByEmail || 'Not provided';
}

/**
 * Gets the display phone for a reporter, handling anonymous cases
 */
export function getReporterDisplayPhone(incident: IncidentResponseDto | IncidentDetailsDto): string {
  if (isReporterAnonymous(incident)) {
    return 'Not provided';
  }
  
  return incident.submittedByPhone || 'Not provided';
}

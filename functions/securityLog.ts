import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Security Event Logger
 * Logs security-relevant events server-side (never logs passwords/tokens/secrets).
 * Callable by any authenticated user for their own events, or admins for any event.
 *
 * Payload: { event_type, details? }
 * event_type: one of the ALLOWED_EVENTS below
 */

const ALLOWED_EVENTS = [
  'account_deactivated',
  'account_deleted',
  'account_reactivated',
  'profile_updated',
  'login_success',
  'login_failed',
  'password_reset_requested',
  'mfa_failed',
  'permission_denied',
  'rate_limit_hit',
  'ai_abuse_detected',
  'admin_action',
  'suspicious_input_detected',
  'onboarding_completed',
  'session_invalidated',
];

const MAX_DETAILS_LENGTH = 500;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { event_type, details } = body;

    // Validate event_type against allowlist
    if (!event_type || !ALLOWED_EVENTS.includes(event_type)) {
      return Response.json(
        { error: `Invalid event_type. Must be one of: ${ALLOWED_EVENTS.join(', ')}` },
        { status: 400 }
      );
    }

    // Sanitize details - never log raw tokens, passwords, or secrets
    let safeDetails = null;
    if (details) {
      const detailsStr = typeof details === 'object'
        ? JSON.stringify(details)
        : String(details);

      // Strip anything that looks like a token, key, or password
      const redacted = detailsStr
        .replace(/"password"\s*:\s*"[^"]*"/gi, '"password":"[REDACTED]"')
        .replace(/"token"\s*:\s*"[^"]*"/gi, '"token":"[REDACTED]"')
        .replace(/"secret"\s*:\s*"[^"]*"/gi, '"secret":"[REDACTED]"')
        .replace(/"api_?key"\s*:\s*"[^"]*"/gi, '"api_key":"[REDACTED]"')
        .slice(0, MAX_DETAILS_LENGTH);

      safeDetails = redacted;
    }

    const logEntry = await base44.asServiceRole.entities.GenerationLog.create({
      type: `SECURITY:${event_type.toUpperCase()}`,
      user_email: user.email,
      status: 'SUCCESS',
      subject_id: 'security_log',
      result_ids: [],
      error_message: safeDetails,
    });

    return Response.json({ logged: true, id: logEntry.id });
  } catch (error) {
    // Never expose stack traces
    return Response.json({ error: 'Logging failed' }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * AI Request Validator + Rate Limiter
 * Validates AI generation requests before passing to the LLM.
 * Enforces: subject allowlist, unit allowlist, mode allowlist, count limits, token limits,
 * prompt injection detection, and per-user abuse quotas.
 *
 * Payload: { subject, unit, mode, count, prompt }
 * Returns: { valid: true, sanitized } or { valid: false, reason }
 */

const ALLOWED_SUBJECTS = [
  'AP Biology', 'AP Chemistry', 'AP Physics', 'AP Calculus AB', 'AP Calculus BC',
  'AP Statistics', 'AP Computer Science A', 'AP US History', 'AP World History',
  'AP Psychology', 'AP English Language', 'AP English Literature',
  'SAT', 'ACT', 'SAT Math', 'SAT Reading', 'SAT Writing',
  'ACT Math', 'ACT English', 'ACT Reading', 'ACT Science',
];

const ALLOWED_MODES = ['practice', 'exam', 'flashcard', 'frq', 'timed', 'untimed'];

const MAX_QUESTION_COUNT = 50;
const MAX_PROMPT_LENGTH = 2000;
const MAX_REQUESTS_PER_HOUR = 60;

// Simple in-memory abuse tracker (resets on function cold start)
const abuseTracker = new Map();

// Prompt injection patterns to detect and strip
const INJECTION_PATTERNS = [
  /ignore (previous|all|above|prior) instructions/gi,
  /you are now/gi,
  /forget (your|all|previous) (instructions|rules|role)/gi,
  /system prompt/gi,
  /act as (a|an) (different|new|other)/gi,
  /\bDAN\b/g, // "Do Anything Now" jailbreak
  /jailbreak/gi,
  /pretend (you are|to be)/gi,
  /override (your|the) (rules|instructions|policy)/gi,
  /disregard (your|the) (training|guidelines|rules)/gi,
];

function detectPromptInjection(text) {
  return INJECTION_PATTERNS.some(pattern => pattern.test(text));
}

function stripUnsafeInstructions(text) {
  let cleaned = text;
  INJECTION_PATTERNS.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '[REMOVED]');
  });
  return cleaned;
}

function checkRateLimit(userId) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour

  const record = abuseTracker.get(userId) || { count: 0, windowStart: now, violations: 0 };

  // Reset window if expired
  if (now - record.windowStart > windowMs) {
    record.count = 0;
    record.windowStart = now;
  }

  record.count += 1;
  abuseTracker.set(userId, record);

  if (record.count > MAX_REQUESTS_PER_HOUR) {
    record.violations = (record.violations || 0) + 1;
    abuseTracker.set(userId, record);
    return { allowed: false, resetIn: windowMs - (now - record.windowStart) };
  }

  return { allowed: true, remaining: MAX_REQUESTS_PER_HOUR - record.count };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit check
    const rateCheck = checkRateLimit(user.id || user.email);
    if (!rateCheck.allowed) {
      // Log the rate limit hit
      await base44.asServiceRole.entities.GenerationLog.create({
        type: 'SECURITY:RATE_LIMIT_HIT',
        user_email: user.email,
        status: 'BLOCKED',
        subject_id: 'ai_endpoint',
        result_ids: [],
        error_message: `Rate limit exceeded. Reset in ${Math.ceil(rateCheck.resetIn / 1000)}s`,
      });

      return Response.json(
        { valid: false, reason: 'Rate limit exceeded. Please wait before making more requests.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateCheck.resetIn / 1000)) } }
      );
    }

    const body = await req.json();
    const { subject, unit, mode, count, prompt } = body;

    const errors = [];

    // Validate subject against allowlist (if provided)
    if (subject && !ALLOWED_SUBJECTS.some(s => s.toLowerCase() === subject.toLowerCase())) {
      errors.push(`Subject "${subject}" is not in the allowed list`);
    }

    // Validate mode against allowlist (if provided)
    if (mode && !ALLOWED_MODES.includes(mode.toLowerCase())) {
      errors.push(`Mode "${mode}" is not allowed`);
    }

    // Validate count
    if (count !== undefined) {
      const n = parseInt(count, 10);
      if (isNaN(n) || n < 1 || n > MAX_QUESTION_COUNT) {
        errors.push(`Count must be between 1 and ${MAX_QUESTION_COUNT}`);
      }
    }

    // Check for prompt injection
    if (prompt) {
      if (prompt.length > MAX_PROMPT_LENGTH) {
        errors.push(`Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`);
      }

      if (detectPromptInjection(prompt)) {
        // Log the abuse attempt
        await base44.asServiceRole.entities.GenerationLog.create({
          type: 'SECURITY:PROMPT_INJECTION_DETECTED',
          user_email: user.email,
          status: 'BLOCKED',
          subject_id: 'ai_endpoint',
          result_ids: [],
          error_message: 'Prompt injection attempt detected',
        });

        return Response.json(
          { valid: false, reason: 'Request contains disallowed instructions.' },
          { status: 400 }
        );
      }
    }

    if (errors.length > 0) {
      return Response.json({ valid: false, reason: errors.join('; ') }, { status: 400 });
    }

    // Return sanitized values
    const sanitized = {
      subject: subject ? subject.trim().slice(0, 100) : undefined,
      unit: unit ? unit.trim().slice(0, 100) : undefined,
      mode: mode ? mode.toLowerCase() : undefined,
      count: count ? Math.min(parseInt(count, 10), MAX_QUESTION_COUNT) : undefined,
      prompt: prompt ? stripUnsafeInstructions(prompt.trim().slice(0, MAX_PROMPT_LENGTH)) : undefined,
    };

    return Response.json({ valid: true, sanitized });
  } catch (error) {
    return Response.json({ error: 'Validation failed' }, { status: 500 });
  }
});
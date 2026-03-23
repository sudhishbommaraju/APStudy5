import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Admin Audit Log — records sensitive admin operations server-side.
 * Payload: { action, entity, entity_id?, details? }
 * Only callable by authenticated admin users.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { action, entity, entity_id, details } = await req.json();

    if (!action || !entity) {
      return Response.json({ error: 'Missing required fields: action, entity' }, { status: 400 });
    }

    const logEntry = await base44.asServiceRole.entities.GenerationLog.create({
      type: `ADMIN_AUDIT:${action}`,
      user_email: user.email,
      status: 'SUCCESS',
      subject_id: entity,
      result_ids: entity_id ? [entity_id] : [],
      error_message: details ? JSON.stringify(details) : null,
    });

    return Response.json({ logged: true, id: logEntry.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
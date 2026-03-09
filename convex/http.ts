import { httpAction, httpRouter } from './_generated/server';
import { api } from './_generated/api';
import { Id } from './_generated/dataModel';

const http = httpRouter();

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,x-admin-session',
    'Content-Type': 'application/json',
  };
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders() });
}

async function parseJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function getAdminSessionToken(request: Request) {
  return request.headers.get('x-admin-session') || '';
}

async function requireAdmin(ctx: any, request: Request) {
  const token = getAdminSessionToken(request);
  if (!token) {
    return { ok: false, response: jsonResponse({ error: 'Missing admin session.' }, 401) };
  }

  const session = await ctx.runQuery(api.admin.getSession, { token });
  if (!session || session.expiresAt < Date.now()) {
    return { ok: false, response: jsonResponse({ error: 'Admin session expired.' }, 401) };
  }

  return { ok: true };
}

const handleOptions = httpAction(async () => new Response(null, { status: 204, headers: corsHeaders() }));

http.route({ path: '/admin/login', method: 'OPTIONS', handler: handleOptions });
http.route({ path: '/admin/logout', method: 'OPTIONS', handler: handleOptions });
http.route({ path: '/admin/session', method: 'OPTIONS', handler: handleOptions });
http.route({ path: '/members', method: 'OPTIONS', handler: handleOptions });
http.route({ path: '/members/import', method: 'OPTIONS', handler: handleOptions });
http.route({ path: '/events', method: 'OPTIONS', handler: handleOptions });
http.route({ path: '/site-content', method: 'OPTIONS', handler: handleOptions });

http.route({
  path: '/admin/login',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const body = (await parseJson(request)) as { password?: string };
    const expectedPassword = process.env.ADMIN_PASSWORD;
    if (!expectedPassword) {
      return jsonResponse({ error: 'Server not configured: ADMIN_PASSWORD missing.' }, 500);
    }

    if (!body.password || body.password !== expectedPassword) {
      return jsonResponse({ error: 'Invalid admin password.' }, 401);
    }

    await ctx.runMutation(api.admin.deleteExpiredSessions, {});
    const { token } = await ctx.runMutation(api.admin.createSession, {});
    return jsonResponse({ token });
  }),
});

http.route({
  path: '/admin/logout',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const auth = await requireAdmin(ctx, request);
    if (!auth.ok) return auth.response;

    const token = getAdminSessionToken(request);
    await ctx.runMutation(api.admin.deleteSession, { token });
    return jsonResponse({ ok: true });
  }),
});

http.route({
  path: '/admin/session',
  method: 'GET',
  handler: httpAction(async (ctx, request) => {
    const auth = await requireAdmin(ctx, request);
    if (!auth.ok) return auth.response;
    return jsonResponse({ ok: true });
  }),
});

http.route({
  path: '/members',
  method: 'GET',
  handler: httpAction(async (ctx, request) => {
    const auth = await requireAdmin(ctx, request);
    if (!auth.ok) return auth.response;
    const members = await ctx.runQuery(api.members.listMembers, {});
    return jsonResponse({ members });
  }),
});

http.route({
  path: '/members',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const body = await parseJson(request);
    const result = await ctx.runMutation(api.members.createMember, body);
    return jsonResponse(result, 201);
  }),
});

http.route({
  path: '/members',
  method: 'DELETE',
  handler: httpAction(async (ctx, request) => {
    const auth = await requireAdmin(ctx, request);
    if (!auth.ok) return auth.response;

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (id) {
      await ctx.runMutation(api.members.deleteMember, { id: id as Id<'members'> });
      return jsonResponse({ ok: true });
    }

    const cleared = await ctx.runMutation(api.members.clearMembers, {});
    return jsonResponse(cleared);
  }),
});

http.route({
  path: '/members/import',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const auth = await requireAdmin(ctx, request);
    if (!auth.ok) return auth.response;

    const body = (await parseJson(request)) as { members?: unknown[] };
    const members = Array.isArray(body.members) ? body.members : [];
    const result = await ctx.runMutation(api.members.importMembers, {
      members: members as any[],
    });
    return jsonResponse(result);
  }),
});

http.route({
  path: '/events',
  method: 'GET',
  handler: httpAction(async (ctx) => {
    const events = await ctx.runQuery(api.events.listUpcomingEvents, {});
    return jsonResponse({ events });
  }),
});

http.route({
  path: '/events',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const auth = await requireAdmin(ctx, request);
    if (!auth.ok) return auth.response;
    const body = await parseJson(request);
    const created = await ctx.runMutation(api.events.createUpcomingEvent, body);
    return jsonResponse(created, 201);
  }),
});

http.route({
  path: '/events',
  method: 'PUT',
  handler: httpAction(async (ctx, request) => {
    const auth = await requireAdmin(ctx, request);
    if (!auth.ok) return auth.response;
    const body = await parseJson(request);
    const updated = await ctx.runMutation(api.events.updateUpcomingEvent, body);
    return jsonResponse(updated);
  }),
});

http.route({
  path: '/events',
  method: 'DELETE',
  handler: httpAction(async (ctx, request) => {
    const auth = await requireAdmin(ctx, request);
    if (!auth.ok) return auth.response;
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return jsonResponse({ error: 'Missing id query parameter.' }, 400);
    await ctx.runMutation(api.events.deleteUpcomingEvent, { id: id as Id<'upcomingEvents'> });
    return jsonResponse({ ok: true });
  }),
});

http.route({
  path: '/site-content',
  method: 'GET',
  handler: httpAction(async (ctx) => {
    const content = await ctx.runQuery(api.siteContent.getSiteContent, {});
    return jsonResponse({ content });
  }),
});

http.route({
  path: '/site-content',
  method: 'PUT',
  handler: httpAction(async (ctx, request) => {
    const auth = await requireAdmin(ctx, request);
    if (!auth.ok) return auth.response;
    const body = await parseJson(request);
    const saved = await ctx.runMutation(api.siteContent.saveSiteContent, { value: body });
    return jsonResponse(saved);
  }),
});

http.route({
  path: '/site-content',
  method: 'DELETE',
  handler: httpAction(async (ctx, request) => {
    const auth = await requireAdmin(ctx, request);
    if (!auth.ok) return auth.response;
    const reset = await ctx.runMutation(api.siteContent.resetSiteContent, {});
    return jsonResponse(reset);
  }),
});

export default http;

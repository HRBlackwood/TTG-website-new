import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

const SESSION_LIFETIME_MS = 1000 * 60 * 60 * 24 * 7;

export const createSession = mutation({
  args: {},
  handler: async (ctx) => {
    const token = crypto.randomUUID();
    const now = Date.now();
    await ctx.db.insert('adminSessions', {
      token,
      createdAt: new Date(now).toISOString(),
      expiresAt: now + SESSION_LIFETIME_MS,
    });
    return { token };
  },
});

export const getSession = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    return await ctx.db
      .query('adminSessions')
      .withIndex('by_token', (q) => q.eq('token', token))
      .unique();
  },
});

export const deleteSession = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const row = await ctx.db
      .query('adminSessions')
      .withIndex('by_token', (q) => q.eq('token', token))
      .unique();
    if (row) {
      await ctx.db.delete(row._id);
    }
    return { ok: true };
  },
});

export const deleteExpiredSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sessions = await ctx.db.query('adminSessions').collect();
    const expired = sessions.filter((s) => s.expiresAt < now);
    await Promise.all(expired.map((s) => ctx.db.delete(s._id)));
    return { cleaned: expired.length };
  },
});

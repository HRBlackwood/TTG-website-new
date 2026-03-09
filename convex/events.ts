import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const listUpcomingEvents = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query('upcomingEvents').collect();
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return events;
  },
});

export const createUpcomingEvent = mutation({
  args: {
    title: v.string(),
    date: v.string(),
    time: v.string(),
    location: v.string(),
    image: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('upcomingEvents', {
      ...args,
      createdAt: new Date().toISOString(),
    });
    return { id };
  },
});

export const updateUpcomingEvent = mutation({
  args: {
    id: v.id('upcomingEvents'),
    title: v.string(),
    date: v.string(),
    time: v.string(),
    location: v.string(),
    image: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...patch }) => {
    await ctx.db.patch(id, patch);
    return { ok: true };
  },
});

export const deleteUpcomingEvent = mutation({
  args: { id: v.id('upcomingEvents') },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
    return { ok: true };
  },
});

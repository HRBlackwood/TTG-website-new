import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

const PRIMARY_KEY = 'primary';

export const getSiteContent = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query('siteContent')
      .withIndex('by_key', (q) => q.eq('key', PRIMARY_KEY))
      .unique();
    return row?.value || {};
  },
});

export const saveSiteContent = mutation({
  args: { value: v.any() },
  handler: async (ctx, { value }) => {
    const existing = await ctx.db
      .query('siteContent')
      .withIndex('by_key', (q) => q.eq('key', PRIMARY_KEY))
      .unique();

    const updatedAt = new Date().toISOString();
    if (existing) {
      await ctx.db.patch(existing._id, { value, updatedAt });
      return { ok: true };
    }

    await ctx.db.insert('siteContent', {
      key: PRIMARY_KEY,
      value,
      updatedAt,
    });
    return { ok: true };
  },
});

export const resetSiteContent = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query('siteContent')
      .withIndex('by_key', (q) => q.eq('key', PRIMARY_KEY))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return { ok: true };
  },
});

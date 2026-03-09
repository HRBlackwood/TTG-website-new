import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const createMember = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    studentId: v.optional(v.string()),
    phone: v.string(),
    email: v.string(),
    emergencyName: v.string(),
    emergencyNumber: v.string(),
    games: v.optional(v.string()),
    paymentMethod: v.string(),
    paymentDate: v.optional(v.string()),
    message: v.optional(v.string()),
    submittedAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const submittedAt = args.submittedAt || new Date().toISOString();
    const id = await ctx.db.insert('members', { ...args, submittedAt });
    return { id };
  },
});

export const listMembers = query({
  args: {},
  handler: async (ctx) => {
    const members = await ctx.db.query('members').collect();
    members.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    return members;
  },
});

export const deleteMember = mutation({
  args: { id: v.id('members') },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
    return { ok: true };
  },
});

export const clearMembers = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('members').collect();
    await Promise.all(all.map((m) => ctx.db.delete(m._id)));
    return { count: all.length };
  },
});

export const importMembers = mutation({
  args: {
    members: v.array(
      v.object({
        firstName: v.string(),
        lastName: v.string(),
        studentId: v.optional(v.string()),
        phone: v.string(),
        email: v.string(),
        emergencyName: v.string(),
        emergencyNumber: v.string(),
        games: v.optional(v.string()),
        paymentMethod: v.string(),
        paymentDate: v.optional(v.string()),
        message: v.optional(v.string()),
        submittedAt: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, { members }) => {
    for (const member of members) {
      await ctx.db.insert('members', {
        ...member,
        submittedAt: member.submittedAt || new Date().toISOString(),
      });
    }
    return { imported: members.length };
  },
});

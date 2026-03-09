import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  members: defineTable({
    submittedAt: v.string(),
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
  }).index('by_submittedAt', ['submittedAt']),

  upcomingEvents: defineTable({
    title: v.string(),
    date: v.string(),
    time: v.string(),
    location: v.string(),
    image: v.optional(v.string()),
    description: v.optional(v.string()),
    createdAt: v.string(),
  }).index('by_date', ['date']),

  siteContent: defineTable({
    key: v.string(),
    value: v.any(),
    updatedAt: v.string(),
  }).index('by_key', ['key']),

  adminSessions: defineTable({
    token: v.string(),
    createdAt: v.string(),
    expiresAt: v.number(),
  }).index('by_token', ['token']),
});

import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { internal } from "./_generated/api";

// Authenticate or create user from Telegram Mini-App
export const authenticate = mutation({
  args: { 
    telegramId: v.number(),
    username: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    authDate: v.number(),
  },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      telegramId: v.number(),
      username: v.optional(v.string()),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      photoUrl: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Check if user exists
    const existing = await ctx.db
      .query("users")
      .withIndex("telegramId", (q) => q.eq("telegramId", args.telegramId))
      .unique();

    if (existing) {
      // Update user info
      await ctx.db.patch(existing._id, {
        username: args.username,
        firstName: args.firstName,
        lastName: args.lastName,
        photoUrl: args.photoUrl,
        authDate: args.authDate,
      });
      return { ...existing, ...args };
    }

    // Create new user
    const userId = await ctx.db.insert("users", args);
    return { _id: userId, ...args };
  },
});

// Get current user
export const getCurrentUser = query({
  args: { telegramId: v.number() },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      telegramId: v.number(),
      username: v.optional(v.string()),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      photoUrl: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("telegramId", (q) => q.eq("telegramId", args.telegramId))
      .unique();
  },
});

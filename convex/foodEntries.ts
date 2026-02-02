import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Create a new food entry
export const createEntry = mutation({
  args: {
    userId: v.id("users"),
    foodName: v.string(),
    mood: v.optional(v.union(
      v.literal("great"),
      v.literal("good"),
      v.literal("neutral"),
      v.literal("bad"),
      v.literal("terrible")
    )),
    notes: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    timestamp: v.optional(v.number()), // defaults to now
  },
  returns: v.id("foodEntries"),
  handler: async (ctx, args) => {
    const entryId = await ctx.db.insert("foodEntries", {
      userId: args.userId,
      foodName: args.foodName,
      timestamp: args.timestamp ?? Date.now(),
      mood: args.mood,
      notes: args.notes,
      imageId: args.imageId,
    });
    return entryId;
  },
});

// Get all entries for a user
export const getUserEntries = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("foodEntries"),
    userId: v.id("users"),
    foodName: v.string(),
    timestamp: v.number(),
    mood: v.optional(v.union(
      v.literal("great"),
      v.literal("good"),
      v.literal("neutral"),
      v.literal("bad"),
      v.literal("terrible")
    )),
    notes: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
  })),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("foodEntries")
      .withIndex("userId_timestamp", (q) => q.eq("userId", args.userId))
      .order("desc");

    if (args.limit) {
      query = query.take(args.limit);
    } else {
      query = query.collect();
    }

    return await query;
  },
});

// Get entries for a specific date range
export const getEntriesByDateRange = query({
  args: {
    userId: v.id("users"),
    startDate: v.number(),
    endDate: v.number(),
  },
  returns: v.array(v.object({
    _id: v.id("foodEntries"),
    userId: v.id("users"),
    foodName: v.string(),
    timestamp: v.number(),
    mood: v.optional(v.union(
      v.literal("great"),
      v.literal("good"),
      v.literal("neutral"),
      v.literal("bad"),
      v.literal("terrible")
    )),
    notes: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("foodEntries")
      .withIndex("userId_timestamp", (q) => 
        q.eq("userId", args.userId).gte("timestamp", args.startDate).lte("timestamp", args.endDate)
      )
      .order("desc")
      .collect();
  },
});

// Update an entry
export const updateEntry = mutation({
  args: {
    entryId: v.id("foodEntries"),
    foodName: v.optional(v.string()),
    mood: v.optional(v.union(
      v.literal("great"),
      v.literal("good"),
      v.literal("neutral"),
      v.literal("bad"),
      v.literal("terrible")
    )),
    notes: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { entryId, ...updates } = args;
    // Filter out undefined values
    const patchData = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(entryId, patchData);
    return null;
  },
});

// Delete an entry
export const deleteEntry = mutation({
  args: { entryId: v.id("foodEntries") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.entryId);
    return null;
  },
});

// Get mood statistics for a user
export const getMoodStats = query({
  args: {
    userId: v.id("users"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  returns: v.object({
    great: v.number(),
    good: v.number(),
    neutral: v.number(),
    bad: v.number(),
    terrible: v.number(),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("foodEntries")
      .withIndex("userId_timestamp", (q) => q.eq("userId", args.userId));

    if (args.startDate && args.endDate) {
      query = query.withIndex("userId_timestamp", (q) =>
        q.eq("userId", args.userId)
          .gte("timestamp", args.startDate)
          .lte("timestamp", args.endDate)
      );
    }

    const entries = await query.collect();

    const stats = {
      great: 0,
      good: 0,
      neutral: 0,
      bad: 0,
      terrible: 0,
      total: entries.length,
    };

    for (const entry of entries) {
      if (entry.mood) {
        stats[entry.mood]++;
      }
    }

    return stats;
  },
});

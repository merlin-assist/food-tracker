import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Telegram user info (mini-app auth)
  users: defineTable({
    telegramId: v.number(),
    username: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    authDate: v.number(),
  })
    .index("telegramId", ["telegramId"]),

  // Food entries with mood tracking
  foodEntries: defineTable({
    userId: v.id("users"),
    foodName: v.string(),
    timestamp: v.number(), // when eaten
    mood: v.optional(v.union(
      v.literal("great"),
      v.literal("good"),
      v.literal("neutral"),
      v.literal("bad"),
      v.literal("terrible")
    )),
    notes: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")), // optional photo
  })
    .index("userId", ["userId"])
    .index("userId_timestamp", ["userId", "timestamp"]),
});

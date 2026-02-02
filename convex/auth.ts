import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import crypto from "crypto";

// Telegram Bot Token (set in Convex dashboard env vars)
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Verify Telegram Mini-App initData
function verifyTelegramInitData(initData: string): {
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  authDate: number;
} | null {
  if (!BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN not configured");
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;

  // Remove hash from params
  params.delete("hash");

  // Sort params and create data check string
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  // Create secret key from bot token
  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(BOT_TOKEN)
    .digest();

  // Calculate hash
  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (calculatedHash !== hash) {
    return null;
  }

  // Parse user data
  const userJson = params.get("user");
  if (!userJson) return null;

  try {
    const user = JSON.parse(userJson);
    return {
      telegramId: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      photoUrl: user.photo_url,
      authDate: parseInt(params.get("auth_date") || "0", 10),
    };
  } catch {
    return null;
  }
}

// Authenticate or create user from Telegram Mini-App
export const authenticate = mutation({
  args: { initData: v.string() },
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
    const telegramData = verifyTelegramInitData(args.initData);
    if (!telegramData) {
      return null;
    }

    // Check if user exists
    const existing = await ctx.db
      .query("users")
      .withIndex("telegramId", (q) => q.eq("telegramId", telegramData.telegramId))
      .unique();

    if (existing) {
      // Update user info
      await ctx.db.patch(existing._id, {
        username: telegramData.username,
        firstName: telegramData.firstName,
        lastName: telegramData.lastName,
        photoUrl: telegramData.photoUrl,
        authDate: telegramData.authDate,
      });
      return { ...existing, ...telegramData };
    }

    // Create new user
    const userId = await ctx.db.insert("users", telegramData);
    return { _id: userId, ...telegramData };
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

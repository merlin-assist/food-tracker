"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import crypto from "crypto";

// Verify Telegram Mini-App initData
function verifyTelegramInitData(initData: string, botToken: string): {
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  authDate: number;
} | null {
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
    .update(botToken)
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

// Action to verify Telegram auth (runs in Node.js)
export const verifyTelegramAuth = action({
  args: { initData: v.string() },
  returns: v.union(
    v.object({
      telegramId: v.number(),
      username: v.optional(v.string()),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      photoUrl: v.optional(v.string()),
      authDate: v.number(),
    }),
    v.null()
  ),
  handler: async (_ctx, args) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      throw new Error("TELEGRAM_BOT_TOKEN not configured");
    }
    return verifyTelegramInitData(args.initData, botToken);
  },
});

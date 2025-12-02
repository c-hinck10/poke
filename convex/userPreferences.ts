import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const savePreferences = mutation({
  args: {
    selectedGame: v.string(),
    selectedSections: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    // Check if user preferences already exist
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      // Update existing preferences
      await ctx.db.patch(existing._id, {
        selectedGame: args.selectedGame,
        selectedSections: args.selectedSections,
      });
      return existing._id;
    } else {
      // Create new preferences
      const id = await ctx.db.insert("userPreferences", {
        userId,
        selectedGame: args.selectedGame,
        selectedSections: args.selectedSections,
      });
      return id;
    }
  },
});

export const getPreferences = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const userId = identity.subject;

    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return preferences;
  },
});

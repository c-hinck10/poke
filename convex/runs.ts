import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new run
export const createRun = mutation({
  args: {
    name: v.string(),
    game: v.string(),
    description: v.optional(v.string()),
    setAsActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    const now = Date.now();

    // If setAsActive is true, deactivate all other runs
    if (args.setAsActive) {
      const existingRuns = await ctx.db
        .query("runs")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();

      for (const run of existingRuns) {
        if (run.isActive) {
          await ctx.db.patch(run._id, { isActive: false, updatedAt: now });
        }
      }
    }

    const runId = await ctx.db.insert("runs", {
      userId,
      name: args.name,
      game: args.game,
      description: args.description,
      isActive: args.setAsActive ?? false,
      createdAt: now,
      updatedAt: now,
    });

    return runId;
  },
});

// Get all runs for the current user
export const getUserRuns = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const userId = identity.subject;

    const runs = await ctx.db
      .query("runs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return runs;
  },
});

// Get active run
export const getActiveRun = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const userId = identity.subject;

    const activeRun = await ctx.db
      .query("runs")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", userId).eq("isActive", true),
      )
      .first();

    return activeRun;
  },
});

// Get a specific run by ID
export const getRun = query({
  args: { runId: v.id("runs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const run = await ctx.db.get(args.runId);

    // Verify the run belongs to the user
    if (run && run.userId !== identity.subject) {
      return null;
    }

    return run;
  },
});

// Update a run
export const updateRun = mutation({
  args: {
    runId: v.id("runs"),
    name: v.optional(v.string()),
    game: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    const run = await ctx.db.get(args.runId);

    if (!run || run.userId !== userId) {
      throw new Error("Run not found or unauthorized");
    }

    const now = Date.now();

    // If setting this run as active, deactivate all other runs
    if (args.isActive) {
      const existingRuns = await ctx.db
        .query("runs")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();

      for (const otherRun of existingRuns) {
        if (otherRun._id !== args.runId && otherRun.isActive) {
          await ctx.db.patch(otherRun._id, { isActive: false, updatedAt: now });
        }
      }
    }

    const updates: any = { updatedAt: now };
    if (args.name !== undefined) updates.name = args.name;
    if (args.game !== undefined) updates.game = args.game;
    if (args.description !== undefined) updates.description = args.description;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.runId, updates);

    return args.runId;
  },
});

// Delete a run (and all associated data)
export const deleteRun = mutation({
  args: { runId: v.id("runs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    const run = await ctx.db.get(args.runId);

    if (!run || run.userId !== userId) {
      throw new Error("Run not found or unauthorized");
    }

    // Delete all pokedex entries for this run
    const pokedexEntries = await ctx.db
      .query("pokedexEntries")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .collect();

    for (const entry of pokedexEntries) {
      await ctx.db.delete(entry._id);
    }

    // Delete all party pokemon for this run
    const partyPokemon = await ctx.db
      .query("partyPokemon")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .collect();

    for (const pokemon of partyPokemon) {
      await ctx.db.delete(pokemon._id);
    }

    // Finally, delete the run itself
    await ctx.db.delete(args.runId);

    return { success: true };
  },
});

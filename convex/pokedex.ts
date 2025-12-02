import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Add or update a Pokédex entry
export const upsertPokedexEntry = mutation({
  args: {
    runId: v.id("runs"),
    pokemonId: v.number(),
    pokemonName: v.string(),
    status: v.union(v.literal("seen"), v.literal("caught"), v.literal("owned")),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    // Verify the run belongs to the user
    const run = await ctx.db.get(args.runId);
    if (!run || run.userId !== userId) {
      throw new Error("Run not found or unauthorized");
    }

    // Check if entry already exists
    const existing = await ctx.db
      .query("pokedexEntries")
      .withIndex("by_run_pokemon", (q) =>
        q.eq("runId", args.runId).eq("pokemonId", args.pokemonId),
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing entry
      const updates: any = {
        status: args.status,
      };

      if (args.location !== undefined) updates.location = args.location;
      if (args.notes !== undefined) updates.notes = args.notes;

      // Set caughtAt timestamp if status is being updated to caught or owned
      if ((args.status === "caught" || args.status === "owned") && !existing.caughtAt) {
        updates.caughtAt = now;
      }

      await ctx.db.patch(existing._id, updates);
      return existing._id;
    } else {
      // Create new entry
      const entryId = await ctx.db.insert("pokedexEntries", {
        runId: args.runId,
        userId,
        pokemonId: args.pokemonId,
        pokemonName: args.pokemonName,
        status: args.status,
        caughtAt: args.status === "caught" || args.status === "owned" ? now : undefined,
        location: args.location,
        notes: args.notes,
      });
      return entryId;
    }
  },
});

// Get all Pokédex entries for a run
export const getPokedexEntries = query({
  args: { runId: v.id("runs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const userId = identity.subject;

    // Verify the run belongs to the user
    const run = await ctx.db.get(args.runId);
    if (!run || run.userId !== userId) {
      return [];
    }

    const entries = await ctx.db
      .query("pokedexEntries")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .collect();

    return entries;
  },
});

// Get Pokédex statistics for a run
export const getPokedexStats = query({
  args: { runId: v.id("runs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const userId = identity.subject;

    // Verify the run belongs to the user
    const run = await ctx.db.get(args.runId);
    if (!run || run.userId !== userId) {
      return null;
    }

    const entries = await ctx.db
      .query("pokedexEntries")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .collect();

    const stats = {
      total: entries.length,
      seen: entries.filter((e) => e.status === "seen").length,
      caught: entries.filter((e) => e.status === "caught").length,
      owned: entries.filter((e) => e.status === "owned").length,
    };

    return stats;
  },
});

// Get a specific Pokédex entry
export const getPokedexEntry = query({
  args: {
    runId: v.id("runs"),
    pokemonId: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const userId = identity.subject;

    // Verify the run belongs to the user
    const run = await ctx.db.get(args.runId);
    if (!run || run.userId !== userId) {
      return null;
    }

    const entry = await ctx.db
      .query("pokedexEntries")
      .withIndex("by_run_pokemon", (q) =>
        q.eq("runId", args.runId).eq("pokemonId", args.pokemonId),
      )
      .first();

    return entry;
  },
});

// Delete a Pokédex entry
export const deletePokedexEntry = mutation({
  args: {
    entryId: v.id("pokedexEntries"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    const entry = await ctx.db.get(args.entryId);

    if (!entry || entry.userId !== userId) {
      throw new Error("Entry not found or unauthorized");
    }

    await ctx.db.delete(args.entryId);
    return { success: true };
  },
});

// Bulk add Pokédex entries
export const bulkAddPokedexEntries = mutation({
  args: {
    runId: v.id("runs"),
    entries: v.array(
      v.object({
        pokemonId: v.number(),
        pokemonName: v.string(),
        status: v.union(
          v.literal("seen"),
          v.literal("caught"),
          v.literal("owned"),
        ),
        location: v.optional(v.string()),
        notes: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    // Verify the run belongs to the user
    const run = await ctx.db.get(args.runId);
    if (!run || run.userId !== userId) {
      throw new Error("Run not found or unauthorized");
    }

    const now = Date.now();
    const createdIds = [];

    for (const entry of args.entries) {
      // Check if entry already exists
      const existing = await ctx.db
        .query("pokedexEntries")
        .withIndex("by_run_pokemon", (q) =>
          q.eq("runId", args.runId).eq("pokemonId", entry.pokemonId),
        )
        .first();

      if (!existing) {
        const entryId = await ctx.db.insert("pokedexEntries", {
          runId: args.runId,
          userId,
          pokemonId: entry.pokemonId,
          pokemonName: entry.pokemonName,
          status: entry.status,
          caughtAt:
            entry.status === "caught" || entry.status === "owned"
              ? now
              : undefined,
          location: entry.location,
          notes: entry.notes,
        });
        createdIds.push(entryId);
      }
    }

    return { created: createdIds.length };
  },
});

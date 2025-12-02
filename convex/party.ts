import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Add a Pokémon to the party
export const addPartyPokemon = mutation({
  args: {
    runId: v.id("runs"),
    pokemonId: v.number(),
    pokemonName: v.string(),
    nickname: v.optional(v.string()),
    level: v.number(),
    position: v.optional(v.number()),
    gender: v.optional(
      v.union(v.literal("male"), v.literal("female"), v.literal("genderless")),
    ),
    isShiny: v.optional(v.boolean()),
    nature: v.optional(v.string()),
    ability: v.optional(v.string()),
    heldItem: v.optional(v.string()),
    moves: v.optional(v.array(v.string())),
    stats: v.optional(
      v.object({
        hp: v.number(),
        attack: v.number(),
        defense: v.number(),
        specialAttack: v.number(),
        specialDefense: v.number(),
        speed: v.number(),
      }),
    ),
    ivs: v.optional(
      v.object({
        hp: v.number(),
        attack: v.number(),
        defense: v.number(),
        specialAttack: v.number(),
        specialDefense: v.number(),
        speed: v.number(),
      }),
    ),
    evs: v.optional(
      v.object({
        hp: v.number(),
        attack: v.number(),
        defense: v.number(),
        specialAttack: v.number(),
        specialDefense: v.number(),
        speed: v.number(),
      }),
    ),
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

    // Get current party to determine position
    const currentParty = await ctx.db
      .query("partyPokemon")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .collect();

    // Max party size is 6
    if (currentParty.length >= 6 && args.position === undefined) {
      throw new Error("Party is full (max 6 Pokémon)");
    }

    // Determine position
    let position = args.position;
    if (position === undefined) {
      // Find the first available position (0-5)
      const usedPositions = new Set(currentParty.map((p) => p.position));
      for (let i = 0; i < 6; i++) {
        if (!usedPositions.has(i)) {
          position = i;
          break;
        }
      }
    }

    if (position === undefined || position < 0 || position > 5) {
      throw new Error("Invalid position");
    }

    // Check if position is already taken
    const existingAtPosition = currentParty.find((p) => p.position === position);
    if (existingAtPosition) {
      throw new Error(`Position ${position} is already occupied`);
    }

    const now = Date.now();

    const pokemonId = await ctx.db.insert("partyPokemon", {
      runId: args.runId,
      userId,
      pokemonId: args.pokemonId,
      pokemonName: args.pokemonName,
      nickname: args.nickname,
      level: args.level,
      position,
      gender: args.gender,
      isShiny: args.isShiny,
      nature: args.nature,
      ability: args.ability,
      heldItem: args.heldItem,
      moves: args.moves,
      stats: args.stats,
      ivs: args.ivs,
      evs: args.evs,
      isFainted: false,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    return pokemonId;
  },
});

// Get all party Pokémon for a run
export const getPartyPokemon = query({
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

    const party = await ctx.db
      .query("partyPokemon")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .collect();

    // Sort by position
    return party.sort((a, b) => a.position - b.position);
  },
});

// Update a party Pokémon
export const updatePartyPokemon = mutation({
  args: {
    pokemonId: v.id("partyPokemon"),
    nickname: v.optional(v.string()),
    level: v.optional(v.number()),
    position: v.optional(v.number()),
    gender: v.optional(
      v.union(v.literal("male"), v.literal("female"), v.literal("genderless")),
    ),
    isShiny: v.optional(v.boolean()),
    nature: v.optional(v.string()),
    ability: v.optional(v.string()),
    heldItem: v.optional(v.string()),
    moves: v.optional(v.array(v.string())),
    stats: v.optional(
      v.object({
        hp: v.number(),
        attack: v.number(),
        defense: v.number(),
        specialAttack: v.number(),
        specialDefense: v.number(),
        speed: v.number(),
      }),
    ),
    ivs: v.optional(
      v.object({
        hp: v.number(),
        attack: v.number(),
        defense: v.number(),
        specialAttack: v.number(),
        specialDefense: v.number(),
        speed: v.number(),
      }),
    ),
    evs: v.optional(
      v.object({
        hp: v.number(),
        attack: v.number(),
        defense: v.number(),
        specialAttack: v.number(),
        specialDefense: v.number(),
        speed: v.number(),
      }),
    ),
    isFainted: v.optional(v.boolean()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    const pokemon = await ctx.db.get(args.pokemonId);

    if (!pokemon || pokemon.userId !== userId) {
      throw new Error("Pokémon not found or unauthorized");
    }

    // If updating position, check if it's available
    if (args.position !== undefined && args.position !== pokemon.position) {
      const otherPokemon = await ctx.db
        .query("partyPokemon")
        .withIndex("by_run", (q) => q.eq("runId", pokemon.runId))
        .collect();

      const existingAtPosition = otherPokemon.find(
        (p) => p.position === args.position && p._id !== args.pokemonId,
      );
      if (existingAtPosition) {
        throw new Error(`Position ${args.position} is already occupied`);
      }
    }

    const updates: any = { updatedAt: Date.now() };
    if (args.nickname !== undefined) updates.nickname = args.nickname;
    if (args.level !== undefined) updates.level = args.level;
    if (args.position !== undefined) updates.position = args.position;
    if (args.gender !== undefined) updates.gender = args.gender;
    if (args.isShiny !== undefined) updates.isShiny = args.isShiny;
    if (args.nature !== undefined) updates.nature = args.nature;
    if (args.ability !== undefined) updates.ability = args.ability;
    if (args.heldItem !== undefined) updates.heldItem = args.heldItem;
    if (args.moves !== undefined) updates.moves = args.moves;
    if (args.stats !== undefined) updates.stats = args.stats;
    if (args.ivs !== undefined) updates.ivs = args.ivs;
    if (args.evs !== undefined) updates.evs = args.evs;
    if (args.isFainted !== undefined) updates.isFainted = args.isFainted;
    if (args.notes !== undefined) updates.notes = args.notes;

    await ctx.db.patch(args.pokemonId, updates);

    return args.pokemonId;
  },
});

// Remove a Pokémon from the party
export const removePartyPokemon = mutation({
  args: { pokemonId: v.id("partyPokemon") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    const pokemon = await ctx.db.get(args.pokemonId);

    if (!pokemon || pokemon.userId !== userId) {
      throw new Error("Pokémon not found or unauthorized");
    }

    await ctx.db.delete(args.pokemonId);

    return { success: true };
  },
});

// Reorder party Pokémon (swap positions)
export const reorderParty = mutation({
  args: {
    pokemonId1: v.id("partyPokemon"),
    pokemonId2: v.id("partyPokemon"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const pokemon1 = await ctx.db.get(args.pokemonId1);
    const pokemon2 = await ctx.db.get(args.pokemonId2);

    if (
      !pokemon1 ||
      !pokemon2 ||
      pokemon1.userId !== userId ||
      pokemon2.userId !== userId
    ) {
      throw new Error("Pokémon not found or unauthorized");
    }

    if (pokemon1.runId !== pokemon2.runId) {
      throw new Error("Pokémon must be in the same run");
    }

    const now = Date.now();

    // Swap positions
    const temp = pokemon1.position;
    await ctx.db.patch(args.pokemonId1, {
      position: pokemon2.position,
      updatedAt: now,
    });
    await ctx.db.patch(args.pokemonId2, {
      position: temp,
      updatedAt: now,
    });

    return { success: true };
  },
});

// Get a specific party Pokémon
export const getPartyPokemonById = query({
  args: { pokemonId: v.id("partyPokemon") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const pokemon = await ctx.db.get(args.pokemonId);

    if (!pokemon || pokemon.userId !== identity.subject) {
      return null;
    }

    return pokemon;
  },
});

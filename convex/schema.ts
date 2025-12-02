import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  userPreferences: defineTable({
    userId: v.string(), // Clerk user ID
    selectedGame: v.string(),
    selectedSections: v.array(v.string()),
  }).index("by_user", ["userId"]),

  // Runs/Games tracking
  runs: defineTable({
    userId: v.string(), // Clerk user ID
    name: v.string(), // e.g., "Scarlet Nuzlocke"
    game: v.string(), // e.g., "scarlet-violet"
    isActive: v.boolean(), // Current active run
    createdAt: v.number(),
    updatedAt: v.number(),
    description: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"]),

  // Pokédex progress per run
  pokedexEntries: defineTable({
    runId: v.id("runs"),
    userId: v.string(),
    pokemonId: v.number(), // National Dex number
    pokemonName: v.string(),
    status: v.union(v.literal("seen"), v.literal("caught"), v.literal("owned")), // seen = encountered, caught = in boxes, owned = currently have
    caughtAt: v.optional(v.number()), // timestamp
    location: v.optional(v.string()), // where caught
    notes: v.optional(v.string()),
  })
    .index("by_run", ["runId"])
    .index("by_user", ["userId"])
    .index("by_run_pokemon", ["runId", "pokemonId"]),

  // Party Pokémon tracking
  partyPokemon: defineTable({
    runId: v.id("runs"),
    userId: v.string(),
    pokemonId: v.number(), // National Dex number
    pokemonName: v.string(),
    nickname: v.optional(v.string()),
    level: v.number(),
    position: v.number(), // 0-5 for party order
    gender: v.optional(
      v.union(v.literal("male"), v.literal("female"), v.literal("genderless")),
    ),
    isShiny: v.optional(v.boolean()),
    nature: v.optional(v.string()),
    ability: v.optional(v.string()),
    heldItem: v.optional(v.string()),
    moves: v.optional(v.array(v.string())), // Up to 4 moves
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
    isFainted: v.optional(v.boolean()), // for Nuzlocke runs
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_run", ["runId"])
    .index("by_user", ["userId"])
    .index("by_run_position", ["runId", "position"]),
});

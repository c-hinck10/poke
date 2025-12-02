import {
  PokemonListResponse,
  PokemonDetails,
  GenerationListResponse,
  Generation,
  VersionGroupListResponse,
  VersionGroup,
  PokedexListResponse,
  Pokedex,
  PokemonSpecies,
  EvolutionChain,
  TypeDetails,
  LocationAreaEncounter,
  MoveDetails,
} from "../types/pokemon";

const BASE_URL = "https://pokeapi.co/api/v2";

export const pokeAPI = {
  async getAllPokemon(
    limit: number = 1000,
    offset: number = 0,
  ): Promise<PokemonListResponse> {
    const response = await fetch(
      `${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`,
    );
    if (!response.ok) {
      throw new Error("Failed to fetch Pokemon list");
    }
    return response.json();
  },

  async getPokemonDetails(nameOrId: string | number): Promise<PokemonDetails> {
    const response = await fetch(`${BASE_URL}/pokemon/${nameOrId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch Pokemon details for ${nameOrId}`);
    }
    return response.json();
  },

  async getAllGenerations(): Promise<GenerationListResponse> {
    const response = await fetch(`${BASE_URL}/generation`);
    if (!response.ok) {
      throw new Error("Failed to fetch generations");
    }
    return response.json();
  },

  async getGeneration(nameOrId: string | number): Promise<Generation> {
    const response = await fetch(`${BASE_URL}/generation/${nameOrId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch generation ${nameOrId}`);
    }
    return response.json();
  },

  async getAllVersionGroups(): Promise<VersionGroupListResponse> {
    const response = await fetch(`${BASE_URL}/version-group`);
    if (!response.ok) {
      throw new Error("Failed to fetch version groups");
    }
    return response.json();
  },

  async getVersionGroup(nameOrId: string | number): Promise<VersionGroup> {
    const response = await fetch(`${BASE_URL}/version-group/${nameOrId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch version group ${nameOrId}`);
    }
    return response.json();
  },

  async getAllPokedexes(): Promise<PokedexListResponse> {
    const response = await fetch(`${BASE_URL}/pokedex`);
    if (!response.ok) {
      throw new Error("Failed to fetch pokedexes");
    }
    return response.json();
  },

  async getPokedex(nameOrId: string | number): Promise<Pokedex> {
    const response = await fetch(`${BASE_URL}/pokedex/${nameOrId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch pokedex ${nameOrId}`);
    }
    return response.json();
  },

  async getPokemonSpecies(nameOrId: string | number): Promise<PokemonSpecies> {
    const response = await fetch(`${BASE_URL}/pokemon-species/${nameOrId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch Pokemon species for ${nameOrId}`);
    }
    return response.json();
  },

  async getEvolutionChain(id: number): Promise<EvolutionChain> {
    const response = await fetch(`${BASE_URL}/evolution-chain/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch evolution chain ${id}`);
    }
    return response.json();
  },

  async getType(nameOrId: string | number): Promise<TypeDetails> {
    const response = await fetch(`${BASE_URL}/type/${nameOrId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch type ${nameOrId}`);
    }
    return response.json();
  },

  async getLocationEncounters(
    pokemonId: number,
  ): Promise<LocationAreaEncounter[]> {
    const response = await fetch(`${BASE_URL}/pokemon/${pokemonId}/encounters`);
    if (!response.ok) {
      throw new Error(`Failed to fetch location encounters for ${pokemonId}`);
    }
    return response.json();
  },

  async getMove(nameOrId: string | number): Promise<MoveDetails> {
    const response = await fetch(`${BASE_URL}/move/${nameOrId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch move ${nameOrId}`);
    }
    return response.json();
  },

  extractIdFromUrl(url: string): number {
    const matches = url.match(/\/(\d+)\//);
    return matches ? parseInt(matches[1], 10) : 0;
  },
};

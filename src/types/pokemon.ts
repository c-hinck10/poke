export interface PokemonListItem {
  name: string;
  url: string;
}

export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokemonListItem[];
}

export interface PokemonDetails {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  sprites: {
    front_default: string;
    other: {
      "official-artwork": {
        front_default: string;
      };
    };
  };
  types: Array<{
    slot: number;
    type: {
      name: string;
      url: string;
    };
  }>;
  stats: Array<{
    base_stat: number;
    effort: number;
    stat: {
      name: string;
      url: string;
    };
  }>;
  abilities: Array<{
    ability: {
      name: string;
      url: string;
    };
    is_hidden: boolean;
    slot: number;
  }>;
  moves: Array<{
    move: {
      name: string;
      url: string;
    };
    version_group_details: Array<{
      level_learned_at: number;
      move_learn_method: {
        name: string;
        url: string;
      };
      version_group: {
        name: string;
        url: string;
      };
    }>;
  }>;
  held_items: Array<{
    item: {
      name: string;
      url: string;
    };
    version_details: Array<{
      rarity: number;
      version: {
        name: string;
        url: string;
      };
    }>;
  }>;
  location_area_encounters: string;
}

export interface Generation {
  id: number;
  name: string;
  pokemon_species: Array<{
    name: string;
    url: string;
  }>;
  version_groups: Array<{
    name: string;
    url: string;
  }>;
}

export interface GenerationListItem {
  name: string;
  url: string;
}

export interface GenerationListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: GenerationListItem[];
}

export interface VersionGroup {
  id: number;
  name: string;
  generation: {
    name: string;
    url: string;
  };
  pokedexes: Array<{
    name: string;
    url: string;
  }>;
  versions: Array<{
    name: string;
    url: string;
  }>;
}

export interface VersionGroupListItem {
  name: string;
  url: string;
}

export interface VersionGroupListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: VersionGroupListItem[];
}

export interface Pokedex {
  id: number;
  name: string;
  is_main_series: boolean;
  pokemon_entries: Array<{
    entry_number: number;
    pokemon_species: {
      name: string;
      url: string;
    };
  }>;
}

export interface PokedexListItem {
  name: string;
  url: string;
}

export interface PokedexListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokedexListItem[];
}

export interface PokemonSpecies {
  id: number;
  name: string;
  capture_rate: number;
  base_happiness: number;
  is_baby: boolean;
  is_legendary: boolean;
  is_mythical: boolean;
  gender_rate: number;
  hatch_counter: number;
  has_gender_differences: boolean;
  color: {
    name: string;
    url: string;
  };
  shape: {
    name: string;
    url: string;
  };
  habitat: {
    name: string;
    url: string;
  } | null;
  generation: {
    name: string;
    url: string;
  };
  growth_rate: {
    name: string;
    url: string;
  };
  egg_groups: Array<{
    name: string;
    url: string;
  }>;
  flavor_text_entries: Array<{
    flavor_text: string;
    language: {
      name: string;
      url: string;
    };
    version: {
      name: string;
      url: string;
    };
  }>;
  genera: Array<{
    genus: string;
    language: {
      name: string;
      url: string;
    };
  }>;
  evolution_chain: {
    url: string;
  };
  evolves_from_species: {
    name: string;
    url: string;
  } | null;
}

export interface EvolutionChain {
  id: number;
  chain: EvolutionChainLink;
}

export interface EvolutionChainLink {
  species: {
    name: string;
    url: string;
  };
  evolution_details: Array<{
    min_level: number | null;
    trigger: {
      name: string;
      url: string;
    };
    item: {
      name: string;
      url: string;
    } | null;
  }>;
  evolves_to: EvolutionChainLink[];
}

export interface TypeDetails {
  id: number;
  name: string;
  damage_relations: {
    double_damage_from: Array<{
      name: string;
      url: string;
    }>;
    double_damage_to: Array<{
      name: string;
      url: string;
    }>;
    half_damage_from: Array<{
      name: string;
      url: string;
    }>;
    half_damage_to: Array<{
      name: string;
      url: string;
    }>;
    no_damage_from: Array<{
      name: string;
      url: string;
    }>;
    no_damage_to: Array<{
      name: string;
      url: string;
    }>;
  };
}

export interface LocationAreaEncounter {
  location_area: {
    name: string;
    url: string;
  };
  version_details: Array<{
    max_chance: number;
    version: {
      name: string;
      url: string;
    };
    encounter_details: Array<{
      min_level: number;
      max_level: number;
      chance: number;
      method: {
        name: string;
        url: string;
      };
    }>;
  }>;
}

export interface MoveDetails {
  id: number;
  name: string;
  type: {
    name: string;
    url: string;
  };
  power: number | null;
  pp: number;
  accuracy: number | null;
  damage_class: {
    name: string;
    url: string;
  };
}

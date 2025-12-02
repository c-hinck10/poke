import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { pokeAPI } from "../../../services/pokeapi";
import type { PokemonListItem, VersionGroup } from "../../../types/pokemon";

interface PokemonWithId extends PokemonListItem {
  id: number;
}

interface GameOption {
  id: string;
  name: string;
  displayName: string;
  pokemonNames: Set<string>;
}

export default function PokeScreen() {
  const router = useRouter();
  const [allPokemon, setAllPokemon] = useState<PokemonWithId[]>([]);
  const [displayedPokemon, setDisplayedPokemon] = useState<PokemonWithId[]>([]);
  const [gameOptions, setGameOptions] = useState<GameOption[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterPokemon();
  }, [selectedGame, searchQuery, allPokemon, gameOptions]);

  const getGameDisplayName = (versionGroupName: string): string => {
    const displayNames: Record<string, string> = {
      "red-blue": "Red/Blue",
      yellow: "Yellow",
      "gold-silver": "Gold/Silver",
      crystal: "Crystal",
      "ruby-sapphire": "Ruby/Sapphire",
      emerald: "Emerald",
      "firered-leafgreen": "FireRed/LeafGreen",
      "diamond-pearl": "Diamond/Pearl",
      platinum: "Platinum",
      "heartgold-soulsilver": "HeartGold/SoulSilver",
      "black-white": "Black/White",
      "black-2-white-2": "Black 2/White 2",
      "x-y": "X/Y",
      "omega-ruby-alpha-sapphire": "Omega Ruby/Alpha Sapphire",
      "sun-moon": "Sun/Moon",
      "ultra-sun-ultra-moon": "Ultra Sun/Ultra Moon",
      "lets-go-pikachu-lets-go-eevee": "Let's Go Pikachu/Eevee",
      "sword-shield": "Sword/Shield",
      "brilliant-diamond-shining-pearl": "Brilliant Diamond/Shining Pearl",
      "legends-arceus": "Legends: Arceus",
      "scarlet-violet": "Scarlet/Violet",
    };
    return displayNames[versionGroupName] || versionGroupName;
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch all Pokemon (up to 1000, covers all existing Pokemon)
      const pokemonData = await pokeAPI.getAllPokemon(1000);
      const pokemonWithIds = pokemonData.results.map((pokemon) => ({
        ...pokemon,
        id: pokeAPI.extractIdFromUrl(pokemon.url),
      }));
      setAllPokemon(pokemonWithIds);

      // Fetch all version groups (games)
      const versionGroupsData = await pokeAPI.getAllVersionGroups();
      const versionGroupDetails = await Promise.all(
        versionGroupsData.results.map((vg) => pokeAPI.getVersionGroup(vg.name)),
      );

      // For each version group, fetch its pokedex data to get available Pokemon
      const games: GameOption[] = [];

      for (const versionGroup of versionGroupDetails) {
        // Only process main series games with pokedexes
        if (versionGroup.pokedexes.length > 0) {
          // Get all Pokemon from all pokedexes in this version group
          const pokemonNamesSet = new Set<string>();

          for (const pokedexRef of versionGroup.pokedexes) {
            try {
              const pokedex = await pokeAPI.getPokedex(pokedexRef.name);
              // Only use main series pokedexes
              if (pokedex.is_main_series) {
                pokedex.pokemon_entries.forEach((entry) => {
                  pokemonNamesSet.add(entry.pokemon_species.name);
                });
              }
            } catch (error) {
              console.error(`Error loading pokedex ${pokedexRef.name}:`, error);
            }
          }

          if (pokemonNamesSet.size > 0) {
            games.push({
              id: versionGroup.name,
              name: versionGroup.name,
              displayName: getGameDisplayName(versionGroup.name),
              pokemonNames: pokemonNamesSet,
            });
          }
        }
      }

      // Sort games by ID (chronological order)
      games.sort((a, b) => {
        const aId =
          versionGroupDetails.find((vg) => vg.name === a.name)?.id || 0;
        const bId =
          versionGroupDetails.find((vg) => vg.name === b.name)?.id || 0;
        return aId - bId;
      });

      setGameOptions(games);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterPokemon = () => {
    let filtered = allPokemon;

    // Filter by game
    if (selectedGame !== "all") {
      const game = gameOptions.find((g) => g.id === selectedGame);
      if (game) {
        filtered = filtered.filter((pokemon) =>
          game.pokemonNames.has(pokemon.name),
        );
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((pokemon) =>
        pokemon.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    setDisplayedPokemon(filtered);
  };

  const renderPokemonCard = ({ item }: { item: PokemonWithId }) => {
    const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${item.id}.png`;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/(tabs)/poke/${item.id}`)}
        style={styles.pokemonCard}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.pokemonImage}
          resizeMode="contain"
        />
        <View style={styles.pokemonInfo}>
          <Text style={styles.pokemonNumber}>#{item.id}</Text>
          <Text style={styles.pokemonName}>{item.name}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={styles.loadingText}>Loading Pokemon...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Pokemon..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Game Filter */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            {
              id: "all",
              name: "all",
              displayName: "All Games",
              pokemonNames: new Set(),
            },
            ...gameOptions,
          ]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedGame(item.id)}
              style={[
                styles.filterButton,
                selectedGame === item.id && styles.filterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedGame === item.id && styles.filterButtonTextActive,
                ]}
              >
                {item.displayName}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Pokemon List */}
      <FlatList
        data={displayedPokemon}
        renderItem={renderPokemonCard}
        keyExtractor={(item) => item.name}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No Pokemon found matching your search
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },
  loadingText: {
    marginTop: 16,
    color: "#4b5563",
  },
  searchBarContainer: {
    backgroundColor: "#ffffff",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
  },
  filterContainer: {
    backgroundColor: "#ffffff",
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: "#e5e7eb",
  },
  filterButtonActive: {
    backgroundColor: "#ef4444",
  },
  filterButtonText: {
    fontWeight: "600",
    color: "#374151",
  },
  filterButtonTextActive: {
    color: "#ffffff",
  },
  listContent: {
    padding: 8,
  },
  pokemonCard: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 16,
    margin: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: "row",
    alignItems: "center",
    width: "45%",
  },
  pokemonImage: {
    width: 80,
    height: 80,
  },
  pokemonInfo: {
    marginLeft: 8,
    flex: 1,
  },
  pokemonNumber: {
    fontSize: 12,
    color: "#6b7280",
  },
  pokemonName: {
    fontSize: 16,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    color: "#6b7280",
    textAlign: "center",
  },
});

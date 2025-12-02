import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { pokeAPI } from "../../../services/pokeapi";
import type {
  PokemonDetails,
  PokemonSpecies,
  TypeDetails,
  EvolutionChain,
  LocationAreaEncounter,
  MoveDetails,
} from "../../../types/pokemon";
import DetailSectionSelector, {
  type DetailSection,
} from "../../../components/DetailSectionSelector";

interface GameVersion {
  name: string;
  displayName: string;
  generation: number;
  priority: number;
}

export default function PokemonDetailScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { pokeId } = useLocalSearchParams<{ pokeId: string }>();
  const [pokemon, setPokemon] = useState<PokemonDetails | null>(null);
  const [species, setSpecies] = useState<PokemonSpecies | null>(null);
  const [typeDetails, setTypeDetails] = useState<TypeDetails[]>([]);
  const [evolutionChain, setEvolutionChain] = useState<EvolutionChain | null>(
    null,
  );
  const [locations, setLocations] = useState<LocationAreaEncounter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [availableGames, setAvailableGames] = useState<GameVersion[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>("all");
  const [selectedSections, setSelectedSections] = useState<DetailSection[]>([
    "types",
    "stats",
    "abilities",
    "physicalStats",
    "typeEffectiveness",
    "description",
    "evolution",
  ]);
  const [moveDetails, setMoveDetails] = useState<Map<string, MoveDetails>>(
    new Map(),
  );

  // Convex hooks
  const userPreferences = useQuery(api.userPreferences.getPreferences);
  const savePreferences = useMutation(api.userPreferences.savePreferences);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Load user preferences when they're available
  useEffect(() => {
    // Only run this once when userPreferences query has completed (either with data or null)
    if (userPreferences !== undefined && !preferencesLoaded) {
      if (userPreferences) {
        // User has saved preferences, load them
        setSelectedGame(userPreferences.selectedGame);
        setSelectedSections(
          userPreferences.selectedSections as DetailSection[],
        );
      }
      // Mark as loaded whether we found preferences or not
      setPreferencesLoaded(true);
    }
  }, [userPreferences, preferencesLoaded]);

  // Save preferences when they change (only if user is authenticated)
  useEffect(() => {
    if (preferencesLoaded) {
      // Use try-catch to handle authentication errors gracefully
      savePreferences({
        selectedGame,
        selectedSections,
      })
        .then(() => {
          console.log("Preferences saved successfully");
        })
        .catch((err) => {
          console.error(
            "Could not save preferences (user may not be authenticated):",
            err,
          );
        });
    }
  }, [selectedGame, selectedSections, preferencesLoaded]);

  useEffect(() => {
    loadPokemonDetails();
  }, [pokeId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: pokemon ? formatName(pokemon.name) : "Pokémon",
      headerRight: () => (
        <View style={styles.headerRight}>
          <DetailSectionSelector
            selectedSections={selectedSections}
            onToggleSection={toggleSection}
          />
        </View>
      ),
    });
  }, [navigation, selectedSections, pokemon]);

  const getGameInfo = (versionName: string): GameVersion | null => {
    const gameMap: Record<
      string,
      { displayName: string; generation: number; priority: number }
    > = {
      // Generation I
      "red-blue": { displayName: "Red/Blue", generation: 1, priority: 1 },
      red: { displayName: "Red/Blue", generation: 1, priority: 1 },
      blue: { displayName: "Red/Blue", generation: 1, priority: 1 },
      yellow: { displayName: "Yellow", generation: 1, priority: 2 },

      // Generation II
      "gold-silver": { displayName: "Gold/Silver", generation: 2, priority: 1 },
      gold: { displayName: "Gold/Silver", generation: 2, priority: 1 },
      silver: { displayName: "Gold/Silver", generation: 2, priority: 1 },
      crystal: { displayName: "Crystal", generation: 2, priority: 2 },

      // Generation III
      "ruby-sapphire": {
        displayName: "Ruby/Sapphire",
        generation: 3,
        priority: 1,
      },
      ruby: { displayName: "Ruby/Sapphire", generation: 3, priority: 1 },
      sapphire: { displayName: "Ruby/Sapphire", generation: 3, priority: 1 },
      emerald: { displayName: "Emerald", generation: 3, priority: 2 },
      "firered-leafgreen": {
        displayName: "FireRed/LeafGreen",
        generation: 3,
        priority: 3,
      },
      firered: { displayName: "FireRed/LeafGreen", generation: 3, priority: 3 },
      leafgreen: {
        displayName: "FireRed/LeafGreen",
        generation: 3,
        priority: 3,
      },

      // Generation IV
      "diamond-pearl": {
        displayName: "Diamond/Pearl",
        generation: 4,
        priority: 1,
      },
      diamond: { displayName: "Diamond/Pearl", generation: 4, priority: 1 },
      pearl: { displayName: "Diamond/Pearl", generation: 4, priority: 1 },
      platinum: { displayName: "Platinum", generation: 4, priority: 2 },
      "heartgold-soulsilver": {
        displayName: "HeartGold/SoulSilver",
        generation: 4,
        priority: 3,
      },
      heartgold: {
        displayName: "HeartGold/SoulSilver",
        generation: 4,
        priority: 3,
      },
      soulsilver: {
        displayName: "HeartGold/SoulSilver",
        generation: 4,
        priority: 3,
      },

      // Generation V
      "black-white": { displayName: "Black/White", generation: 5, priority: 1 },
      black: { displayName: "Black/White", generation: 5, priority: 1 },
      white: { displayName: "Black/White", generation: 5, priority: 1 },
      "black-2-white-2": {
        displayName: "Black 2/White 2",
        generation: 5,
        priority: 2,
      },
      "black-2": { displayName: "Black 2/White 2", generation: 5, priority: 2 },
      "white-2": { displayName: "Black 2/White 2", generation: 5, priority: 2 },

      // Generation VI
      "x-y": { displayName: "X/Y", generation: 6, priority: 1 },
      x: { displayName: "X/Y", generation: 6, priority: 1 },
      y: { displayName: "X/Y", generation: 6, priority: 1 },
      "omega-ruby-alpha-sapphire": {
        displayName: "Omega Ruby/Alpha Sapphire",
        generation: 6,
        priority: 2,
      },
      "omega-ruby": {
        displayName: "Omega Ruby/Alpha Sapphire",
        generation: 6,
        priority: 2,
      },
      "alpha-sapphire": {
        displayName: "Omega Ruby/Alpha Sapphire",
        generation: 6,
        priority: 2,
      },

      // Generation VII
      "sun-moon": { displayName: "Sun/Moon", generation: 7, priority: 1 },
      sun: { displayName: "Sun/Moon", generation: 7, priority: 1 },
      moon: { displayName: "Sun/Moon", generation: 7, priority: 1 },
      "ultra-sun-ultra-moon": {
        displayName: "Ultra Sun/Ultra Moon",
        generation: 7,
        priority: 2,
      },
      "ultra-sun": {
        displayName: "Ultra Sun/Ultra Moon",
        generation: 7,
        priority: 2,
      },
      "ultra-moon": {
        displayName: "Ultra Sun/Ultra Moon",
        generation: 7,
        priority: 2,
      },
      "lets-go-pikachu-lets-go-eevee": {
        displayName: "Let's Go Pikachu/Eevee",
        generation: 7,
        priority: 3,
      },
      "lets-go-pikachu": {
        displayName: "Let's Go Pikachu/Eevee",
        generation: 7,
        priority: 3,
      },
      "lets-go-eevee": {
        displayName: "Let's Go Pikachu/Eevee",
        generation: 7,
        priority: 3,
      },

      // Generation VIII
      "sword-shield": {
        displayName: "Sword/Shield",
        generation: 8,
        priority: 1,
      },
      sword: { displayName: "Sword/Shield", generation: 8, priority: 1 },
      shield: { displayName: "Sword/Shield", generation: 8, priority: 1 },
      "brilliant-diamond-shining-pearl": {
        displayName: "Brilliant Diamond/Shining Pearl",
        generation: 8,
        priority: 2,
      },
      "brilliant-diamond": {
        displayName: "Brilliant Diamond/Shining Pearl",
        generation: 8,
        priority: 2,
      },
      "shining-pearl": {
        displayName: "Brilliant Diamond/Shining Pearl",
        generation: 8,
        priority: 2,
      },
      "legends-arceus": {
        displayName: "Legends: Arceus",
        generation: 8,
        priority: 3,
      },

      // Generation IX
      "scarlet-violet": {
        displayName: "Scarlet/Violet",
        generation: 9,
        priority: 1,
      },
      scarlet: { displayName: "Scarlet/Violet", generation: 9, priority: 1 },
      violet: { displayName: "Scarlet/Violet", generation: 9, priority: 1 },
    };

    const info = gameMap[versionName];
    if (info) {
      return {
        name: versionName,
        displayName: info.displayName,
        generation: info.generation,
        priority: info.priority,
      };
    }
    return null;
  };

  const getGameDisplayName = (versionName: string): string => {
    const gameInfo = getGameInfo(versionName);
    return gameInfo?.displayName || formatName(versionName);
  };

  const loadPokemonDetails = async () => {
    try {
      setLoading(true);
      const pokemonData = await pokeAPI.getPokemonDetails(pokeId);
      setPokemon(pokemonData);

      const speciesData = await pokeAPI.getPokemonSpecies(pokeId);
      setSpecies(speciesData);

      // Extract available games from flavor text entries and move details
      const gamesMap = new Map<string, GameVersion>();

      speciesData.flavor_text_entries.forEach((entry) => {
        const gameInfo = getGameInfo(entry.version.name);
        if (gameInfo && !gamesMap.has(gameInfo.displayName)) {
          gamesMap.set(gameInfo.displayName, gameInfo);
        }
      });

      pokemonData.moves.forEach((move) => {
        move.version_group_details.forEach((vgd) => {
          const gameInfo = getGameInfo(vgd.version_group.name);
          if (gameInfo && !gamesMap.has(gameInfo.displayName)) {
            gamesMap.set(gameInfo.displayName, gameInfo);
          }
        });
      });

      const gamesList: GameVersion[] = Array.from(gamesMap.values());
      // Sort by generation, then by priority within generation
      gamesList.sort((a, b) => {
        if (a.generation !== b.generation) {
          return a.generation - b.generation;
        }
        return a.priority - b.priority;
      });
      setAvailableGames(gamesList);

      const typeDetailsPromises = pokemonData.types.map((t) =>
        pokeAPI.getType(t.type.name),
      );
      const types = await Promise.all(typeDetailsPromises);
      setTypeDetails(types);

      if (speciesData.evolution_chain) {
        const evolutionId = pokeAPI.extractIdFromUrl(
          speciesData.evolution_chain.url,
        );
        const evolution = await pokeAPI.getEvolutionChain(evolutionId);
        setEvolutionChain(evolution);
      }

      const locationData = await pokeAPI.getLocationEncounters(
        parseInt(pokeId),
      );
      setLocations(locationData);
    } catch (error) {
      console.error("Error loading Pokemon details:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: DetailSection) => {
    setSelectedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      normal: "#A8A878",
      fire: "#F08030",
      water: "#6890F0",
      electric: "#F8D030",
      grass: "#78C850",
      ice: "#98D8D8",
      fighting: "#C03028",
      poison: "#A040A0",
      ground: "#E0C068",
      flying: "#A890F0",
      psychic: "#F85888",
      bug: "#A8B820",
      rock: "#B8A038",
      ghost: "#705898",
      dragon: "#7038F8",
      dark: "#705848",
      steel: "#B8B8D0",
      fairy: "#EE99AC",
    };
    return colors[type] || "#A8A878";
  };

  const formatName = (name: string) => {
    return name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getFilteredFlavorText = () => {
    if (!species) return "";

    let entries = species.flavor_text_entries.filter(
      (entry) => entry.language.name === "en",
    );

    if (selectedGame !== "all") {
      entries = entries.filter((entry) => entry.version.name === selectedGame);
    }

    const entry = entries[entries.length - 1] || entries[0];
    return entry
      ? entry.flavor_text.replace(/\f/g, " ").replace(/\n/g, " ")
      : "";
  };

  const getFilteredMoves = () => {
    if (!pokemon) return [];

    let moves = pokemon.moves.filter((m) =>
      m.version_group_details.some(
        (v) => v.move_learn_method.name === "level-up",
      ),
    );

    if (selectedGame !== "all") {
      moves = moves.filter((m) =>
        m.version_group_details.some(
          (v) => v.version_group.name === selectedGame,
        ),
      );
    }

    return moves
      .sort((a, b) => {
        const getLevel = (move: (typeof moves)[0]) => {
          const detail = move.version_group_details.find(
            (v) =>
              v.move_learn_method.name === "level-up" &&
              (selectedGame === "all" || v.version_group.name === selectedGame),
          );
          return detail?.level_learned_at || 0;
        };
        return getLevel(a) - getLevel(b);
      })
      .slice(0, 30);
  };

  // Fetch move details when filtered moves change
  useEffect(() => {
    const fetchMoveDetails = async () => {
      const moves = getFilteredMoves();
      const newMoveDetails = new Map(moveDetails);

      for (const move of moves) {
        if (!newMoveDetails.has(move.move.name)) {
          try {
            const details = await pokeAPI.getMove(move.move.name);
            newMoveDetails.set(move.move.name, details);
          } catch (error) {
            console.error(
              `Failed to fetch move details for ${move.move.name}:`,
              error,
            );
          }
        }
      }

      setMoveDetails(newMoveDetails);
    };

    if (pokemon) {
      fetchMoveDetails();
    }
  }, [pokemon, selectedGame]);

  const getFilteredLocations = () => {
    if (!locations.length) return [];

    if (selectedGame === "all") return locations.slice(0, 10);

    return locations
      .filter((loc) =>
        loc.version_details.some((v) => v.version.name === selectedGame),
      )
      .slice(0, 10);
  };

  const renderEvolutionChain = (chain: any, level: number = 0): any => {
    if (!chain) return null;

    const pokemonId = pokeAPI.extractIdFromUrl(chain.species.url);
    const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;

    return (
      <View key={chain.species.name}>
        <TouchableOpacity
          style={styles.evolutionItem}
          onPress={() => router.push(`/poke/${pokemonId}`)}
        >
          <Image source={{ uri: imageUrl }} style={styles.evolutionImage} />
          <Text style={styles.evolutionName}>
            {formatName(chain.species.name)}
          </Text>
          {chain.evolution_details && chain.evolution_details.length > 0 && (
            <Text style={styles.evolutionMethod}>
              {chain.evolution_details[0].min_level
                ? `Lv. ${chain.evolution_details[0].min_level}`
                : formatName(chain.evolution_details[0].trigger.name)}
            </Text>
          )}
        </TouchableOpacity>
        {chain.evolves_to && chain.evolves_to.length > 0 && (
          <View style={styles.evolutionArrow}>
            <Text style={styles.arrowText}>↓</Text>
            {chain.evolves_to.map((evolution: any) =>
              renderEvolutionChain(evolution, level + 1),
            )}
          </View>
        )}
      </View>
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

  if (!pokemon || !species) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.notFoundText}>Pokemon not found</Text>
      </View>
    );
  }

  const combinedTypeEffectiveness = () => {
    if (typeDetails.length === 0) return null;

    const effectiveness = {
      doubleDamageFrom: new Set<string>(),
      halfDamageFrom: new Set<string>(),
      noDamageFrom: new Set<string>(),
      doubleDamageTo: new Set<string>(),
      halfDamageTo: new Set<string>(),
      noDamageTo: new Set<string>(),
    };

    typeDetails.forEach((type) => {
      type.damage_relations.double_damage_from.forEach((t) =>
        effectiveness.doubleDamageFrom.add(t.name),
      );
      type.damage_relations.half_damage_from.forEach((t) =>
        effectiveness.halfDamageFrom.add(t.name),
      );
      type.damage_relations.no_damage_from.forEach((t) =>
        effectiveness.noDamageFrom.add(t.name),
      );
      type.damage_relations.double_damage_to.forEach((t) =>
        effectiveness.doubleDamageTo.add(t.name),
      );
      type.damage_relations.half_damage_to.forEach((t) =>
        effectiveness.halfDamageTo.add(t.name),
      );
      type.damage_relations.no_damage_to.forEach((t) =>
        effectiveness.noDamageTo.add(t.name),
      );
    });

    return effectiveness;
  };

  const typeEffectiveness = combinedTypeEffectiveness();
  const filteredMoves = getFilteredMoves();
  const filteredLocations = getFilteredLocations();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Image
            source={{
              uri: pokemon.sprites.other["official-artwork"].front_default,
            }}
            style={styles.mainImage}
            resizeMode="contain"
          />
          <Text style={styles.pokemonName}>{formatName(pokemon.name)}</Text>
          <Text style={styles.pokemonId}>#{pokemon.id}</Text>

          {/* Game Filter */}
          <View style={styles.gameFilterContainer}>
            <Text style={styles.gameFilterLabel}>Filter by Game:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedGame}
                onValueChange={(value) => setSelectedGame(value)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="All Games" value="all" />
                {availableGames.reduce((acc, game, index) => {
                  const prevGame = availableGames[index - 1];
                  const isNewGeneration =
                    !prevGame || prevGame.generation !== game.generation;

                  if (isNewGeneration) {
                    acc.push(
                      <Picker.Item
                        key={`gen-${game.generation}`}
                        label={`— Generation ${game.generation} —`}
                        value={`gen-${game.generation}`}
                        enabled={false}
                        style={styles.generationHeader}
                      />,
                    );
                  }

                  acc.push(
                    <Picker.Item
                      key={game.name}
                      label={`  ${game.displayName}`}
                      value={game.name}
                    />,
                  );

                  return acc;
                }, [] as JSX.Element[])}
              </Picker>
            </View>
          </View>
        </View>

        {selectedSections.includes("description") && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{getFilteredFlavorText()}</Text>
            <Text style={styles.genus}>
              {species.genera.find((g) => g.language.name === "en")?.genus}
            </Text>
          </View>
        )}

        {selectedSections.includes("types") && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Types</Text>
            <View style={styles.typesContainer}>
              {pokemon.types.map((typeInfo) => (
                <View
                  key={typeInfo.type.name}
                  style={[
                    styles.typeBadge,
                    { backgroundColor: getTypeColor(typeInfo.type.name) },
                  ]}
                >
                  <Text style={styles.typeBadgeText}>
                    {formatName(typeInfo.type.name)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {selectedSections.includes("physicalStats") && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Physical Stats</Text>
            <View style={styles.physicalStatsContainer}>
              <View style={styles.physicalStat}>
                <Text style={styles.physicalStatValue}>
                  {pokemon.height / 10}m
                </Text>
                <Text style={styles.physicalStatLabel}>Height</Text>
              </View>
              <View style={styles.physicalStat}>
                <Text style={styles.physicalStatValue}>
                  {pokemon.weight / 10}kg
                </Text>
                <Text style={styles.physicalStatLabel}>Weight</Text>
              </View>
            </View>
          </View>
        )}

        {selectedSections.includes("abilities") && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Abilities</Text>
            {pokemon.abilities.map((abilityInfo) => (
              <View key={abilityInfo.ability.name} style={styles.abilityRow}>
                <Text style={styles.abilityName}>
                  {formatName(abilityInfo.ability.name)}
                </Text>
                {abilityInfo.is_hidden && (
                  <Text style={styles.hiddenBadge}>Hidden</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {selectedSections.includes("stats") && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Base Stats</Text>
            {pokemon.stats.map((statInfo) => {
              const maxStat = 255;
              const percentage = (statInfo.base_stat / maxStat) * 100;

              return (
                <View key={statInfo.stat.name} style={styles.statRow}>
                  <View style={styles.statHeader}>
                    <Text style={styles.statName}>
                      {formatName(statInfo.stat.name)}
                    </Text>
                    <Text style={styles.statValue}>{statInfo.base_stat}</Text>
                  </View>
                  <View style={styles.statBarBackground}>
                    <View
                      style={[styles.statBarFill, { width: `${percentage}%` }]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {selectedSections.includes("typeEffectiveness") &&
          typeEffectiveness && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Type Effectiveness</Text>

              {typeEffectiveness.noDamageFrom.size > 0 && (
                <View style={styles.effectivenessGroup}>
                  <Text style={styles.effectivenessLabel}>Immune To (0x):</Text>
                  <View style={styles.typesList}>
                    {Array.from(typeEffectiveness.noDamageFrom).map((type) => (
                      <View
                        key={type}
                        style={[
                          styles.smallTypeBadge,
                          { backgroundColor: getTypeColor(type) },
                        ]}
                      >
                        <Text style={styles.smallTypeBadgeText}>
                          {formatName(type)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {typeEffectiveness.halfDamageFrom.size > 0 && (
                <View style={styles.effectivenessGroup}>
                  <Text style={styles.effectivenessLabel}>Resists (0.5x):</Text>
                  <View style={styles.typesList}>
                    {Array.from(typeEffectiveness.halfDamageFrom).map(
                      (type) => (
                        <View
                          key={type}
                          style={[
                            styles.smallTypeBadge,
                            { backgroundColor: getTypeColor(type) },
                          ]}
                        >
                          <Text style={styles.smallTypeBadgeText}>
                            {formatName(type)}
                          </Text>
                        </View>
                      ),
                    )}
                  </View>
                </View>
              )}

              {typeEffectiveness.doubleDamageFrom.size > 0 && (
                <View style={styles.effectivenessGroup}>
                  <Text style={styles.effectivenessLabel}>Weak To (2x):</Text>
                  <View style={styles.typesList}>
                    {Array.from(typeEffectiveness.doubleDamageFrom).map(
                      (type) => (
                        <View
                          key={type}
                          style={[
                            styles.smallTypeBadge,
                            { backgroundColor: getTypeColor(type) },
                          ]}
                        >
                          <Text style={styles.smallTypeBadgeText}>
                            {formatName(type)}
                          </Text>
                        </View>
                      ),
                    )}
                  </View>
                </View>
              )}

              {typeEffectiveness.doubleDamageTo.size > 0 && (
                <View style={styles.effectivenessGroup}>
                  <Text style={styles.effectivenessLabel}>
                    Strong Against (2x):
                  </Text>
                  <View style={styles.typesList}>
                    {Array.from(typeEffectiveness.doubleDamageTo).map(
                      (type) => (
                        <View
                          key={type}
                          style={[
                            styles.smallTypeBadge,
                            { backgroundColor: getTypeColor(type) },
                          ]}
                        >
                          <Text style={styles.smallTypeBadgeText}>
                            {formatName(type)}
                          </Text>
                        </View>
                      ),
                    )}
                  </View>
                </View>
              )}
            </View>
          )}

        {selectedSections.includes("evolution") && evolutionChain && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evolution Chain</Text>
            <View style={styles.evolutionContainer}>
              {renderEvolutionChain(evolutionChain.chain)}
            </View>
          </View>
        )}

        {selectedSections.includes("eggGroups") && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Breeding Info</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Egg Groups:</Text>
              <Text style={styles.infoValue}>
                {species.egg_groups.map((g) => formatName(g.name)).join(", ")}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hatch Counter:</Text>
              <Text style={styles.infoValue}>
                {species.hatch_counter * 255} steps
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Gender Ratio:</Text>
              <Text style={styles.infoValue}>
                {species.gender_rate === -1
                  ? "Genderless"
                  : `${((8 - species.gender_rate) / 8) * 100}% ♂ / ${(species.gender_rate / 8) * 100}% ♀`}
              </Text>
            </View>
          </View>
        )}

        {selectedSections.includes("captureInfo") && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Capture Info</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Catch Rate:</Text>
              <Text style={styles.infoValue}>{species.capture_rate}/255</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Base Happiness:</Text>
              <Text style={styles.infoValue}>{species.base_happiness}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Base Experience:</Text>
              <Text style={styles.infoValue}>{pokemon.base_experience}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Growth Rate:</Text>
              <Text style={styles.infoValue}>
                {formatName(species.growth_rate.name)}
              </Text>
            </View>
            {species.habitat && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Habitat:</Text>
                <Text style={styles.infoValue}>
                  {formatName(species.habitat.name)}
                </Text>
              </View>
            )}
          </View>
        )}

        {selectedSections.includes("moves") && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Moves (Level-Up)
              {selectedGame !== "all" &&
                ` - ${getGameDisplayName(selectedGame)}`}
            </Text>
            <Text style={styles.subtext}>
              Showing moves learned by leveling up
            </Text>
            {filteredMoves.length > 0 ? (
              filteredMoves.map((moveInfo) => {
                const levelUpDetail = moveInfo.version_group_details.find(
                  (v) =>
                    v.move_learn_method.name === "level-up" &&
                    (selectedGame === "all" ||
                      v.version_group.name === selectedGame),
                );
                const details = moveDetails.get(moveInfo.move.name);
                return (
                  <View key={moveInfo.move.name} style={styles.moveRow}>
                    <Text style={styles.moveLevel}>
                      Lv. {levelUpDetail?.level_learned_at || "—"}
                    </Text>
                    <Text style={styles.moveName}>
                      {formatName(moveInfo.move.name)}
                    </Text>
                    {details && (
                      <View
                        style={[
                          styles.moveTypeBadge,
                          { backgroundColor: getTypeColor(details.type.name) },
                        ]}
                      >
                        <Text style={styles.moveTypeBadgeText}>
                          {formatName(details.type.name)}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <Text style={styles.description}>
                No moves available for this game version.
              </Text>
            )}
          </View>
        )}

        {selectedSections.includes("locations") &&
          filteredLocations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Catch Locations
                {selectedGame !== "all" &&
                  ` - ${getGameDisplayName(selectedGame)}`}
              </Text>
              {filteredLocations.map((location) => (
                <View
                  key={location.location_area.name}
                  style={styles.locationRow}
                >
                  <Text style={styles.locationName}>
                    {formatName(location.location_area.name)}
                  </Text>
                  {location.version_details.length > 0 && (
                    <Text style={styles.locationChance}>
                      {location.version_details[0].max_chance}%
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

        {selectedSections.includes("heldItems") &&
          pokemon.held_items.length > 0 && (
            <View style={[styles.section, styles.lastSection]}>
              <Text style={styles.sectionTitle}>Held Items</Text>
              {pokemon.held_items.map((itemInfo) => (
                <View key={itemInfo.item.name} style={styles.itemRow}>
                  <Text style={styles.itemName}>
                    {formatName(itemInfo.item.name)}
                  </Text>
                  {itemInfo.version_details.length > 0 && (
                    <Text style={styles.itemRarity}>
                      {itemInfo.version_details[0].rarity}%
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  scrollView: {
    flex: 1,
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
  notFoundText: {
    color: "#4b5563",
  },
  headerRight: {
    marginRight: 16,
  },
  header: {
    backgroundColor: "#ffffff",
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  mainImage: {
    width: 200,
    height: 200,
  },
  pokemonName: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 16,
  },
  pokemonId: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 4,
  },
  gameFilterContainer: {
    width: "100%",
    marginTop: 20,
  },
  gameFilterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f9fafb",
  },
  picker: {
    width: "100%",
    height: Platform.OS === "ios" ? 180 : 50,
  },
  pickerItem: {
    fontSize: 16,
  },
  section: {
    backgroundColor: "#ffffff",
    marginTop: 12,
    padding: 16,
  },
  lastSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#1f2937",
  },
  subtext: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 8,
  },
  genus: {
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
  },
  typesContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  typeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  typeBadgeText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  physicalStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  physicalStat: {
    alignItems: "center",
  },
  physicalStatValue: {
    fontSize: 22,
    fontWeight: "bold",
  },
  physicalStatLabel: {
    color: "#6b7280",
    marginTop: 4,
  },
  abilityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    justifyContent: "space-between",
  },
  abilityName: {
    fontSize: 15,
    color: "#374151",
  },
  hiddenBadge: {
    backgroundColor: "#9333ea",
    color: "#ffffff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 11,
    fontWeight: "600",
  },
  statRow: {
    marginBottom: 12,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  statName: {
    color: "#374151",
    fontSize: 14,
  },
  statValue: {
    fontWeight: "600",
    fontSize: 14,
  },
  statBarBackground: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
    overflow: "hidden",
  },
  statBarFill: {
    height: "100%",
    backgroundColor: "#ef4444",
    borderRadius: 3,
  },
  effectivenessGroup: {
    marginBottom: 16,
  },
  effectivenessLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  typesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  smallTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  smallTypeBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  evolutionContainer: {
    alignItems: "center",
  },
  evolutionItem: {
    alignItems: "center",
    marginVertical: 8,
  },
  evolutionImage: {
    width: 100,
    height: 100,
  },
  evolutionName: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  evolutionMethod: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  evolutionArrow: {
    alignItems: "center",
  },
  arrowText: {
    fontSize: 24,
    color: "#9ca3af",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  infoLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },
  moveRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  moveLevel: {
    fontSize: 13,
    color: "#6b7280",
    width: 50,
  },
  moveName: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
  },
  moveTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  moveTypeBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },
  locationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  locationName: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
  },
  locationChance: {
    fontSize: 13,
    color: "#6b7280",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  itemName: {
    fontSize: 13,
    color: "#374151",
  },
  itemRarity: {
    fontSize: 13,
    color: "#6b7280",
  },
  bottomPadding: {
    height: 40,
  },
});

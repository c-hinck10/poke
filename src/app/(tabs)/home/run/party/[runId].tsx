import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { pokeAPI } from "../../../../../services/pokeapi";
import type {
  PokemonDetails,
  MoveDetails,
  TypeDetails,
} from "../../../../../types/pokemon";

interface PokemonSuggestion {
  id: number;
  name: string;
  status: "caught" | "owned";
}

interface PokemonQuickInfo {
  details: PokemonDetails;
  moveDetails: MoveDetails[];
  typeDetails: TypeDetails[];
}

export default function PartyManagementScreen() {
  const { runId } = useLocalSearchParams<{ runId: Id<"runs"> }>();
  const router = useRouter();

  const run = useQuery(api.runs.getRun, { runId });
  const partyPokemon = useQuery(api.party.getPartyPokemon, { runId });
  const pokedexEntries = useQuery(api.pokedex.getPokedexEntries, { runId });
  const addPokemon = useMutation(api.party.addPartyPokemon);
  const updatePokemon = useMutation(api.party.updatePartyPokemon);
  const removePokemon = useMutation(api.party.removePartyPokemon);
  const reorderParty = useMutation(api.party.reorderParty);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPokemon, setEditingPokemon] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PokemonSuggestion[]>([]);
  const [selectedPokemon, setSelectedPokemon] =
    useState<PokemonSuggestion | null>(null);
  const [expandedPokemon, setExpandedPokemon] = useState<Set<string>>(
    new Set(),
  );
  const [pokemonQuickInfo, setPokemonQuickInfo] = useState<
    Map<string, PokemonQuickInfo>
  >(new Map());
  const [loadingQuickInfo, setLoadingQuickInfo] = useState<Set<string>>(
    new Set(),
  );
  const [formData, setFormData] = useState({
    pokemonName: "",
    pokemonId: "",
    nickname: "",
    level: "1",
    gender: "male" as "male" | "female" | "genderless",
    isShiny: false,
    nature: "",
    ability: "",
    heldItem: "",
    moves: ["", "", "", ""],
    notes: "",
  });

  // Filter suggestions based on search query from Pokédex entries
  useEffect(() => {
    if (!searchQuery.trim() || editingPokemon || selectedPokemon) {
      setSuggestions([]);
      return;
    }

    if (!pokedexEntries) return;

    const query = searchQuery.toLowerCase();
    const caughtOwned = pokedexEntries.filter(
      (entry) => entry.status === "caught" || entry.status === "owned",
    );

    const filtered = caughtOwned
      .filter(
        (entry) =>
          entry.pokemonName.toLowerCase().includes(query) ||
          entry.pokemonId.toString().includes(query),
      )
      .map((entry) => ({
        id: entry.pokemonId,
        name: entry.pokemonName,
        status: entry.status as "caught" | "owned",
      }))
      .slice(0, 10);

    setSuggestions(filtered);
  }, [searchQuery, pokedexEntries, editingPokemon, selectedPokemon]);

  const handleAddOrUpdate = async () => {
    const pokemonId = parseInt(formData.pokemonId);
    const level = parseInt(formData.level);

    if (!formData.pokemonName.trim() || isNaN(pokemonId) || isNaN(level)) {
      Alert.alert(
        "Error",
        "Please fill in required fields (Pokémon name, ID, and level)",
      );
      return;
    }

    try {
      const moves = formData.moves.filter((m) => m.trim());

      if (editingPokemon) {
        await updatePokemon({
          pokemonId: editingPokemon._id,
          nickname: formData.nickname.trim() || undefined,
          level,
          gender: formData.gender,
          isShiny: formData.isShiny,
          nature: formData.nature.trim() || undefined,
          ability: formData.ability.trim() || undefined,
          heldItem: formData.heldItem.trim() || undefined,
          moves: moves.length > 0 ? moves : undefined,
          notes: formData.notes.trim() || undefined,
        });
      } else {
        await addPokemon({
          runId,
          pokemonId,
          pokemonName: formData.pokemonName.trim().toLowerCase(),
          nickname: formData.nickname.trim() || undefined,
          level,
          gender: formData.gender,
          isShiny: formData.isShiny,
          nature: formData.nature.trim() || undefined,
          ability: formData.ability.trim() || undefined,
          heldItem: formData.heldItem.trim() || undefined,
          moves: moves.length > 0 ? moves : undefined,
          notes: formData.notes.trim() || undefined,
        });
      }

      resetForm();
      setIsModalVisible(false);
      Alert.alert(
        "Success",
        editingPokemon ? "Pokémon updated!" : "Pokémon added to party!",
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save Pokémon");
      console.error(error);
    }
  };

  const handleEdit = (pokemon: any) => {
    setEditingPokemon(pokemon);
    setFormData({
      pokemonName: pokemon.pokemonName,
      pokemonId: pokemon.pokemonId.toString(),
      nickname: pokemon.nickname || "",
      level: pokemon.level.toString(),
      gender: pokemon.gender || "male",
      isShiny: pokemon.isShiny || false,
      nature: pokemon.nature || "",
      ability: pokemon.ability || "",
      heldItem: pokemon.heldItem || "",
      moves: [
        ...(pokemon.moves || []),
        ...Array(4 - (pokemon.moves?.length || 0)).fill(""),
      ].slice(0, 4),
      notes: pokemon.notes || "",
    });
    setIsModalVisible(true);
  };

  const handleRemove = (pokemon: any) => {
    Alert.alert(
      "Remove Pokémon",
      `Remove ${pokemon.nickname || pokemon.pokemonName} from your party?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removePokemon({ pokemonId: pokemon._id });
            } catch (error) {
              Alert.alert("Error", "Failed to remove Pokémon");
              console.error(error);
            }
          },
        },
      ],
    );
  };

  const handleSelectSuggestion = (suggestion: PokemonSuggestion) => {
    setSelectedPokemon(suggestion);
    setSearchQuery(suggestion.name);
    setFormData({
      ...formData,
      pokemonName: suggestion.name,
      pokemonId: suggestion.id.toString(),
    });
    setSuggestions([]);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setSelectedPokemon(null);
    if (!editingPokemon) {
      setFormData({
        ...formData,
        pokemonName: text,
        pokemonId: "",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      pokemonName: "",
      pokemonId: "",
      nickname: "",
      level: "1",
      gender: "male",
      isShiny: false,
      nature: "",
      ability: "",
      heldItem: "",
      moves: ["", "", "", ""],
      notes: "",
    });
    setEditingPokemon(null);
    setSearchQuery("");
    setSelectedPokemon(null);
    setSuggestions([]);
  };

  const updateMove = (index: number, value: string) => {
    const newMoves = [...formData.moves];
    newMoves[index] = value;
    setFormData({ ...formData, moves: newMoves });
  };

  const handleGoToPokedex = () => {
    setIsModalVisible(false);
    resetForm();
    router.push({
      pathname: "/(tabs)/home/run/pokedex/[runId]",
      params: { runId },
    });
  };

  const toggleExpanded = async (pokemonId: string) => {
    const newExpanded = new Set(expandedPokemon);

    if (newExpanded.has(pokemonId)) {
      newExpanded.delete(pokemonId);
    } else {
      newExpanded.add(pokemonId);

      // Load quick info if not already loaded
      if (!pokemonQuickInfo.has(pokemonId)) {
        await loadPokemonQuickInfo(pokemonId);
      }
    }

    setExpandedPokemon(newExpanded);
  };

  const loadPokemonQuickInfo = async (pokemonIdStr: string) => {
    const pokemonId = parseInt(pokemonIdStr);
    setLoadingQuickInfo((prev) => new Set(prev).add(pokemonIdStr));

    try {
      const details = await pokeAPI.getPokemonDetails(pokemonId);

      // Get type details
      const typeDetailsPromises = details.types.map((t) =>
        pokeAPI.getType(t.type.name),
      );
      const typeDetails = await Promise.all(typeDetailsPromises);

      // Get move details for the pokemon's moves
      const partyPoke = partyPokemon?.find((p) => p.pokemonId === pokemonId);
      const moveDetails: MoveDetails[] = [];

      if (partyPoke?.moves && partyPoke.moves.length > 0) {
        for (const moveName of partyPoke.moves) {
          try {
            const moveDetail = await pokeAPI.getMove(
              moveName.toLowerCase().replace(/\s+/g, "-"),
            );
            moveDetails.push(moveDetail);
          } catch (error) {
            console.error(`Failed to load move ${moveName}:`, error);
          }
        }
      }

      setPokemonQuickInfo((prev) =>
        new Map(prev).set(pokemonIdStr, {
          details,
          moveDetails,
          typeDetails,
        }),
      );
    } catch (error) {
      console.error(
        `Failed to load quick info for Pokemon ${pokemonId}:`,
        error,
      );
      Alert.alert("Error", "Failed to load Pokemon details");
    } finally {
      setLoadingQuickInfo((prev) => {
        const newSet = new Set(prev);
        newSet.delete(pokemonIdStr);
        return newSet;
      });
    }
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

  const getCombinedTypeEffectiveness = (typeDetails: TypeDetails[]) => {
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

  const renderPartyPokemon = ({
    item,
    index,
  }: {
    item: any;
    index: number;
  }) => {
    const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.isShiny ? "shiny/" : ""}${item.pokemonId}.png`;
    const pokemonIdStr = item.pokemonId.toString();
    const isExpanded = expandedPokemon.has(pokemonIdStr);
    const quickInfo = pokemonQuickInfo.get(pokemonIdStr);
    const isLoading = loadingQuickInfo.has(pokemonIdStr);

    return (
      <View style={styles.partyCard}>
        <View style={styles.positionBadge}>
          <Text style={styles.positionText}>{index + 1}</Text>
        </View>

        <Image source={{ uri: imageUrl }} style={styles.pokemonImage} />

        <View style={styles.pokemonInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.pokemonName}>
              {item.nickname || item.pokemonName}
            </Text>
            {item.isShiny && (
              <Ionicons name="sparkles" size={16} color="#fbbf24" />
            )}
          </View>

          {item.nickname && (
            <Text style={styles.speciesName}>({item.pokemonName})</Text>
          )}

          <View style={styles.detailsRow}>
            <Text style={styles.level}>Lv. {item.level}</Text>
            {item.gender && (
              <Ionicons
                name={
                  item.gender === "male"
                    ? "male"
                    : item.gender === "female"
                      ? "female"
                      : "help-circle-outline"
                }
                size={16}
                color={
                  item.gender === "male"
                    ? "#3b82f6"
                    : item.gender === "female"
                      ? "#ec4899"
                      : "#9ca3af"
                }
              />
            )}
          </View>

          {item.nature && (
            <Text style={styles.detail}>Nature: {item.nature}</Text>
          )}
          {item.ability && (
            <Text style={styles.detail}>Ability: {item.ability}</Text>
          )}
          {item.heldItem && (
            <Text style={styles.detail}>Item: {item.heldItem}</Text>
          )}

          {item.moves && item.moves.length > 0 && (
            <View style={styles.movesContainer}>
              <Text style={styles.movesTitle}>Moves:</Text>
              {item.moves.map((move: string, i: number) => (
                <Text key={i} style={styles.moveText}>
                  • {move}
                </Text>
              ))}
            </View>
          )}

          {item.isFainted && (
            <View style={styles.faintedBadge}>
              <Text style={styles.faintedText}>Fainted</Text>
            </View>
          )}

          {/* Quick Info Toggle Button */}
          <TouchableOpacity
            style={styles.quickInfoToggle}
            onPress={() => toggleExpanded(pokemonIdStr)}
          >
            <Text style={styles.quickInfoToggleText}>Quick Info</Text>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={16}
              color="#3b82f6"
            />
          </TouchableOpacity>

          {/* Expanded Quick Info */}
          {isExpanded && (
            <View style={styles.quickInfoContainer}>
              {isLoading ? (
                <View style={styles.quickInfoLoading}>
                  <ActivityIndicator size="small" color="#3b82f6" />
                  <Text style={styles.quickInfoLoadingText}>
                    Loading details...
                  </Text>
                </View>
              ) : quickInfo ? (
                <>
                  {/* Move Details */}
                  {quickInfo.moveDetails.length > 0 && (
                    <View style={styles.quickInfoSection}>
                      <Text style={styles.quickInfoSectionTitle}>
                        Move Details
                      </Text>
                      {quickInfo.moveDetails.map((move, i) => (
                        <View key={i} style={styles.moveDetailCard}>
                          <View style={styles.moveDetailHeader}>
                            <Text style={styles.moveDetailName}>
                              {formatName(move.name)}
                            </Text>
                            <View
                              style={[
                                styles.moveTypeChip,
                                {
                                  backgroundColor: getTypeColor(move.type.name),
                                },
                              ]}
                            >
                              <Text style={styles.moveTypeChipText}>
                                {formatName(move.type.name)}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.moveStats}>
                            <View style={styles.moveStat}>
                              <Text style={styles.moveStatLabel}>Power</Text>
                              <Text style={styles.moveStatValue}>
                                {move.power || "-"}
                              </Text>
                            </View>
                            <View style={styles.moveStat}>
                              <Text style={styles.moveStatLabel}>Accuracy</Text>
                              <Text style={styles.moveStatValue}>
                                {move.accuracy || "-"}
                              </Text>
                            </View>
                            <View style={styles.moveStat}>
                              <Text style={styles.moveStatLabel}>PP</Text>
                              <Text style={styles.moveStatValue}>
                                {move.pp}
                              </Text>
                            </View>
                            <View style={styles.moveStat}>
                              <Text style={styles.moveStatLabel}>Class</Text>
                              <Text style={styles.moveStatValue}>
                                {formatName(move.damage_class.name)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Type Effectiveness */}
                  <View style={styles.quickInfoSection}>
                    <Text style={styles.quickInfoSectionTitle}>
                      Type Effectiveness
                    </Text>

                    {/* Pokemon Types */}
                    <View style={styles.pokemonTypes}>
                      {quickInfo.details.types.map((typeInfo) => (
                        <View
                          key={typeInfo.type.name}
                          style={[
                            styles.typeChip,
                            {
                              backgroundColor: getTypeColor(typeInfo.type.name),
                            },
                          ]}
                        >
                          <Text style={styles.typeChipText}>
                            {formatName(typeInfo.type.name)}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {(() => {
                      const effectiveness = getCombinedTypeEffectiveness(
                        quickInfo.typeDetails,
                      );
                      return (
                        <>
                          {/* Defensive Effectiveness */}
                          <Text style={styles.effectivenessSubtitle}>
                            Defensive:
                          </Text>

                          {effectiveness.noDamageFrom.size > 0 && (
                            <View style={styles.effectivenessRow}>
                              <Text style={styles.effectivenessLabel}>
                                Immune (0x):
                              </Text>
                              <View style={styles.effectivenessTypes}>
                                {Array.from(effectiveness.noDamageFrom).map(
                                  (type) => (
                                    <View
                                      key={type}
                                      style={[
                                        styles.smallTypeChip,
                                        { backgroundColor: getTypeColor(type) },
                                      ]}
                                    >
                                      <Text style={styles.smallTypeChipText}>
                                        {formatName(type)}
                                      </Text>
                                    </View>
                                  ),
                                )}
                              </View>
                            </View>
                          )}

                          {effectiveness.halfDamageFrom.size > 0 && (
                            <View style={styles.effectivenessRow}>
                              <Text style={styles.effectivenessLabel}>
                                Resists (0.5x):
                              </Text>
                              <View style={styles.effectivenessTypes}>
                                {Array.from(effectiveness.halfDamageFrom).map(
                                  (type) => (
                                    <View
                                      key={type}
                                      style={[
                                        styles.smallTypeChip,
                                        { backgroundColor: getTypeColor(type) },
                                      ]}
                                    >
                                      <Text style={styles.smallTypeChipText}>
                                        {formatName(type)}
                                      </Text>
                                    </View>
                                  ),
                                )}
                              </View>
                            </View>
                          )}

                          {effectiveness.doubleDamageFrom.size > 0 && (
                            <View style={styles.effectivenessRow}>
                              <Text style={styles.effectivenessLabel}>
                                Weak (2x):
                              </Text>
                              <View style={styles.effectivenessTypes}>
                                {Array.from(effectiveness.doubleDamageFrom).map(
                                  (type) => (
                                    <View
                                      key={type}
                                      style={[
                                        styles.smallTypeChip,
                                        { backgroundColor: getTypeColor(type) },
                                      ]}
                                    >
                                      <Text style={styles.smallTypeChipText}>
                                        {formatName(type)}
                                      </Text>
                                    </View>
                                  ),
                                )}
                              </View>
                            </View>
                          )}

                          {/* Offensive Effectiveness */}
                          <Text
                            style={[
                              styles.effectivenessSubtitle,
                              { marginTop: 12 },
                            ]}
                          >
                            Offensive:
                          </Text>

                          {effectiveness.doubleDamageTo.size > 0 && (
                            <View style={styles.effectivenessRow}>
                              <Text style={styles.effectivenessLabel}>
                                Super Effective (2x):
                              </Text>
                              <View style={styles.effectivenessTypes}>
                                {Array.from(effectiveness.doubleDamageTo).map(
                                  (type) => (
                                    <View
                                      key={type}
                                      style={[
                                        styles.smallTypeChip,
                                        { backgroundColor: getTypeColor(type) },
                                      ]}
                                    >
                                      <Text style={styles.smallTypeChipText}>
                                        {formatName(type)}
                                      </Text>
                                    </View>
                                  ),
                                )}
                              </View>
                            </View>
                          )}

                          {effectiveness.halfDamageTo.size > 0 && (
                            <View style={styles.effectivenessRow}>
                              <Text style={styles.effectivenessLabel}>
                                Not Very Effective (0.5x):
                              </Text>
                              <View style={styles.effectivenessTypes}>
                                {Array.from(effectiveness.halfDamageTo).map(
                                  (type) => (
                                    <View
                                      key={type}
                                      style={[
                                        styles.smallTypeChip,
                                        { backgroundColor: getTypeColor(type) },
                                      ]}
                                    >
                                      <Text style={styles.smallTypeChipText}>
                                        {formatName(type)}
                                      </Text>
                                    </View>
                                  ),
                                )}
                              </View>
                            </View>
                          )}

                          {effectiveness.noDamageTo.size > 0 && (
                            <View style={styles.effectivenessRow}>
                              <Text style={styles.effectivenessLabel}>
                                No Effect (0x):
                              </Text>
                              <View style={styles.effectivenessTypes}>
                                {Array.from(effectiveness.noDamageTo).map(
                                  (type) => (
                                    <View
                                      key={type}
                                      style={[
                                        styles.smallTypeChip,
                                        { backgroundColor: getTypeColor(type) },
                                      ]}
                                    >
                                      <Text style={styles.smallTypeChipText}>
                                        {formatName(type)}
                                      </Text>
                                    </View>
                                  ),
                                )}
                              </View>
                            </View>
                          )}
                        </>
                      );
                    })()}
                  </View>
                </>
              ) : null}
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => handleEdit(item)}
            style={styles.actionButton}
          >
            <Ionicons name="create-outline" size={24} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleRemove(item)}
            style={styles.actionButton}
          >
            <Ionicons name="trash-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const caughtOwnedCount =
    pokedexEntries?.filter(
      (entry) => entry.status === "caught" || entry.status === "owned",
    ).length || 0;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Party",
          headerShown: true,
          headerBackTitle: "Back",
        }}
      />

      <View style={styles.header}>
        <Text style={styles.headerText}>
          Party: {partyPokemon?.length || 0}/6
        </Text>
        {caughtOwnedCount > 0 && (
          <Text style={styles.subheaderText}>
            {caughtOwnedCount} Pokémon available from Pokédex
          </Text>
        )}
      </View>

      <FlatList
        data={partyPokemon || []}
        renderItem={renderPartyPokemon}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyText}>No party Pokémon yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to add Pokémon to your party
            </Text>
            {caughtOwnedCount === 0 && (
              <TouchableOpacity
                style={styles.goToPokedexButton}
                onPress={handleGoToPokedex}
              >
                <Text style={styles.goToPokedexText}>
                  Add Pokémon to Pokédex first
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {(!partyPokemon || partyPokemon.length < 6) && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            resetForm();
            setIsModalVisible(true);
          }}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Add/Edit Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          resetForm();
          setIsModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPokemon ? "Edit Pokémon" : "Add to Party"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  resetForm();
                  setIsModalVisible(false);
                }}
              >
                <Ionicons name="close" size={28} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {!editingPokemon && (
                <>
                  <Text style={styles.label}>
                    Pokémon <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      selectedPokemon && styles.inputSelected,
                    ]}
                    value={searchQuery}
                    onChangeText={handleSearchChange}
                    placeholder="Search from your Pokédex or enter name"
                    autoCapitalize="none"
                  />

                  {selectedPokemon && (
                    <View style={styles.selectedPokemon}>
                      <Image
                        source={{
                          uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${selectedPokemon.id}.png`,
                        }}
                        style={styles.selectedPokemonImage}
                      />
                      <View style={styles.selectedPokemonInfo}>
                        <Text style={styles.selectedPokemonName}>
                          #{selectedPokemon.id} {selectedPokemon.name}
                        </Text>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor:
                                selectedPokemon.status === "owned"
                                  ? "#f59e0b"
                                  : "#10b981",
                            },
                          ]}
                        >
                          <Text style={styles.statusBadgeText}>
                            {selectedPokemon.status}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedPokemon(null);
                          setSearchQuery("");
                          setFormData({
                            ...formData,
                            pokemonName: "",
                            pokemonId: "",
                          });
                        }}
                        style={styles.clearButton}
                      >
                        <Ionicons
                          name="close-circle"
                          size={24}
                          color="#9ca3af"
                        />
                      </TouchableOpacity>
                    </View>
                  )}

                  {suggestions.length > 0 && !selectedPokemon && (
                    <View style={styles.suggestionsContainer}>
                      <Text style={styles.suggestionsHeader}>
                        From your Pokédex:
                      </Text>
                      <FlatList
                        data={suggestions}
                        keyExtractor={(item) => item.id.toString()}
                        scrollEnabled={false}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={styles.suggestionItem}
                            onPress={() => handleSelectSuggestion(item)}
                          >
                            <Image
                              source={{
                                uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.id}.png`,
                              }}
                              style={styles.suggestionImage}
                            />
                            <View style={styles.suggestionInfo}>
                              <Text style={styles.suggestionText}>
                                #{item.id} {item.name}
                              </Text>
                              <View
                                style={[
                                  styles.statusBadgeSmall,
                                  {
                                    backgroundColor:
                                      item.status === "owned"
                                        ? "#f59e0b"
                                        : "#10b981",
                                  },
                                ]}
                              >
                                <Text style={styles.statusBadgeTextSmall}>
                                  {item.status}
                                </Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        )}
                      />
                    </View>
                  )}

                  {caughtOwnedCount === 0 && (
                    <View style={styles.noPokedexNotice}>
                      <Ionicons
                        name="information-circle-outline"
                        size={20}
                        color="#3b82f6"
                      />
                      <Text style={styles.noPokedexText}>
                        No Pokémon in your Pokédex yet.
                      </Text>
                      <TouchableOpacity onPress={handleGoToPokedex}>
                        <Text style={styles.goToPokedexLink}>
                          Add to Pokédex →
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {!selectedPokemon && (
                    <>
                      <Text style={styles.label}>
                        Pokémon ID <Text style={styles.required}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.input}
                        value={formData.pokemonId}
                        onChangeText={(text) =>
                          setFormData({ ...formData, pokemonId: text })
                        }
                        placeholder="e.g., 25"
                        keyboardType="numeric"
                      />
                    </>
                  )}
                </>
              )}

              {editingPokemon && (
                <>
                  <Text style={styles.label}>Pokémon</Text>
                  <View style={styles.editingPokemonDisplay}>
                    <Image
                      source={{
                        uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${formData.pokemonId}.png`,
                      }}
                      style={styles.editingPokemonImage}
                    />
                    <Text style={styles.editingPokemonName}>
                      #{formData.pokemonId} {formData.pokemonName}
                    </Text>
                  </View>
                </>
              )}

              <Text style={styles.label}>Nickname (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.nickname}
                onChangeText={(text) =>
                  setFormData({ ...formData, nickname: text })
                }
                placeholder="Give your Pokémon a nickname"
              />

              <Text style={styles.label}>
                Level <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formData.level}
                onChangeText={(text) =>
                  setFormData({ ...formData, level: text })
                }
                placeholder="1-100"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderSelector}>
                {["male", "female", "genderless"].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderOption,
                      formData.gender === g && styles.genderOptionSelected,
                    ]}
                    onPress={() =>
                      setFormData({ ...formData, gender: g as any })
                    }
                  >
                    <Ionicons
                      name={
                        g === "male"
                          ? "male"
                          : g === "female"
                            ? "female"
                            : "help-circle-outline"
                      }
                      size={24}
                      color={
                        formData.gender === g
                          ? g === "male"
                            ? "#3b82f6"
                            : g === "female"
                              ? "#ec4899"
                              : "#9ca3af"
                          : "#d1d5db"
                      }
                    />
                    <Text
                      style={[
                        styles.genderText,
                        formData.gender === g && styles.genderTextSelected,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() =>
                  setFormData({ ...formData, isShiny: !formData.isShiny })
                }
              >
                <Ionicons
                  name={
                    formData.isShiny ? "checkbox-outline" : "square-outline"
                  }
                  size={24}
                  color="#fbbf24"
                />
                <Text style={styles.checkboxLabel}>Shiny</Text>
              </TouchableOpacity>

              <Text style={styles.label}>Nature (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.nature}
                onChangeText={(text) =>
                  setFormData({ ...formData, nature: text })
                }
                placeholder="e.g., Adamant"
              />

              <Text style={styles.label}>Ability (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.ability}
                onChangeText={(text) =>
                  setFormData({ ...formData, ability: text })
                }
                placeholder="e.g., Static"
              />

              <Text style={styles.label}>Held Item (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.heldItem}
                onChangeText={(text) =>
                  setFormData({ ...formData, heldItem: text })
                }
                placeholder="e.g., Leftovers"
              />

              <Text style={styles.label}>Moves (Optional, up to 4)</Text>
              {formData.moves.map((move, index) => (
                <TextInput
                  key={index}
                  style={[styles.input, styles.moveInput]}
                  value={move}
                  onChangeText={(text) => updateMove(index, text)}
                  placeholder={`Move ${index + 1}`}
                />
              ))}

              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) =>
                  setFormData({ ...formData, notes: text })
                }
                placeholder="Add any notes..."
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  resetForm();
                  setIsModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleAddOrUpdate}
              >
                <Text style={styles.saveButtonText}>
                  {editingPokemon ? "Update" : "Add"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  header: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4b5563",
  },
  subheaderText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  partyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  positionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  positionText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  pokemonImage: {
    width: 80,
    height: 80,
    marginRight: 12,
  },
  pokemonInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pokemonName: {
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  speciesName: {
    fontSize: 14,
    color: "#6b7280",
    textTransform: "capitalize",
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  level: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4b5563",
  },
  detail: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
    textTransform: "capitalize",
  },
  movesContainer: {
    marginTop: 8,
    backgroundColor: "#f9fafb",
    padding: 8,
    borderRadius: 8,
  },
  movesTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4b5563",
    marginBottom: 4,
  },
  moveText: {
    fontSize: 12,
    color: "#6b7280",
    textTransform: "capitalize",
  },
  faintedBadge: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  faintedText: {
    color: "#991b1b",
    fontSize: 12,
    fontWeight: "600",
  },
  actions: {
    justifyContent: "center",
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: "center",
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4b5563",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 8,
  },
  goToPokedexButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#3b82f6",
    borderRadius: 8,
  },
  goToPokedexText: {
    color: "#fff",
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalBody: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 12,
  },
  required: {
    color: "#ef4444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputSelected: {
    borderColor: "#10b981",
    borderWidth: 2,
  },
  moveInput: {
    marginBottom: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  selectedPokemon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#86efac",
  },
  selectedPokemonImage: {
    width: 48,
    height: 48,
  },
  selectedPokemonInfo: {
    flex: 1,
    marginLeft: 8,
  },
  selectedPokemonName: {
    fontSize: 16,
    fontWeight: "600",
    textTransform: "capitalize",
    color: "#166534",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  statusBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  clearButton: {
    padding: 4,
  },
  suggestionsContainer: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    marginTop: 8,
    padding: 8,
    maxHeight: 300,
  },
  suggestionsHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
  },
  suggestionImage: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 16,
    color: "#374151",
    textTransform: "capitalize",
    fontWeight: "500",
  },
  statusBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  statusBadgeTextSmall: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  noPokedexNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  noPokedexText: {
    flex: 1,
    fontSize: 13,
    color: "#1e40af",
  },
  goToPokedexLink: {
    fontSize: 13,
    color: "#3b82f6",
    fontWeight: "600",
  },
  editingPokemonDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  editingPokemonImage: {
    width: 48,
    height: 48,
    marginRight: 12,
  },
  editingPokemonName: {
    fontSize: 16,
    fontWeight: "600",
    textTransform: "capitalize",
    color: "#374151",
  },
  genderSelector: {
    flexDirection: "row",
    gap: 12,
  },
  genderOption: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  genderOptionSelected: {
    backgroundColor: "#f9fafb",
  },
  genderText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9ca3af",
    marginTop: 4,
    textTransform: "capitalize",
  },
  genderTextSelected: {
    color: "#374151",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#374151",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
  },
  cancelButtonText: {
    color: "#374151",
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#ef4444",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  quickInfoToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  quickInfoToggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3b82f6",
  },
  quickInfoContainer: {
    marginTop: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
  },
  quickInfoLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
  },
  quickInfoLoadingText: {
    fontSize: 14,
    color: "#6b7280",
  },
  quickInfoSection: {
    marginBottom: 16,
  },
  quickInfoSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  moveDetailCard: {
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  moveDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  moveDetailName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
  },
  moveTypeChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  moveTypeChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
  moveStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  moveStat: {
    alignItems: "center",
  },
  moveStatLabel: {
    fontSize: 10,
    color: "#9ca3af",
    marginBottom: 2,
  },
  moveStatValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  pokemonTypes: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  effectivenessSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginTop: 8,
    marginBottom: 6,
  },
  effectivenessRow: {
    marginBottom: 8,
  },
  effectivenessLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 4,
  },
  effectivenessTypes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  smallTypeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  smallTypeChipText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
});

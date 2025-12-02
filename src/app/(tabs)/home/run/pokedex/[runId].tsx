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
import { useLocalSearchParams, Stack } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { pokeAPI } from "../../../../../services/pokeapi";

interface PokemonSearchResult {
  id: number;
  name: string;
}

export default function PokedexManagementScreen() {
  const { runId } = useLocalSearchParams<{ runId: Id<"runs"> }>();

  const run = useQuery(api.runs.getRun, { runId });
  const pokedexEntries = useQuery(api.pokedex.getPokedexEntries, { runId });
  const upsertEntry = useMutation(api.pokedex.upsertPokedexEntry);
  const deleteEntry = useMutation(api.pokedex.deletePokedexEntry);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPokemon, setSelectedPokemon] =
    useState<PokemonSearchResult | null>(null);
  const [status, setStatus] = useState<"seen" | "caught" | "owned">("caught");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "seen" | "caught" | "owned"
  >("all");

  const [gamePokemon, setGamePokemon] = useState<PokemonSearchResult[]>([]);
  const [loadingPokemon, setLoadingPokemon] = useState(false);
  const [suggestions, setSuggestions] = useState<PokemonSearchResult[]>([]);

  // Load Pokémon available in the game when modal opens
  useEffect(() => {
    if (isModalVisible && run?.game && gamePokemon.length === 0) {
      loadGamePokemon();
    }
  }, [isModalVisible, run?.game]);

  // Filter suggestions based on search query
  useEffect(() => {
    if (searchQuery.trim() === "" || selectedPokemon) {
      setSuggestions([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = gamePokemon.filter(
      (pokemon) =>
        pokemon.name.toLowerCase().includes(query) ||
        pokemon.id.toString().includes(query),
    );
    setSuggestions(filtered.slice(0, 10)); // Limit to 10 suggestions
  }, [searchQuery, gamePokemon, selectedPokemon]);

  const loadGamePokemon = async () => {
    if (!run?.game) return;

    setLoadingPokemon(true);
    try {
      // Get the version group details
      const versionGroup = await pokeAPI.getVersionGroup(run.game);

      // Get all Pokémon from the pokedexes in this version group
      const pokemonSet = new Map<number, string>();

      for (const pokedexRef of versionGroup.pokedexes) {
        try {
          const pokedex = await pokeAPI.getPokedex(pokedexRef.name);
          if (pokedex.is_main_series) {
            pokedex.pokemon_entries.forEach((entry) => {
              const id = pokeAPI.extractIdFromUrl(entry.pokemon_species.url);
              pokemonSet.set(id, entry.pokemon_species.name);
            });
          }
        } catch (error) {
          console.error(`Error loading pokedex ${pokedexRef.name}:`, error);
        }
      }

      // Convert to array and sort by ID
      const pokemonList = Array.from(pokemonSet.entries())
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.id - b.id);

      setGamePokemon(pokemonList);
    } catch (error) {
      console.error("Error loading game Pokemon:", error);
      Alert.alert("Error", "Failed to load Pokémon for this game");
    } finally {
      setLoadingPokemon(false);
    }
  };

  const handleAddEntry = async () => {
    if (!selectedPokemon) {
      Alert.alert("Error", "Please select a Pokémon");
      return;
    }

    try {
      await upsertEntry({
        runId,
        pokemonId: selectedPokemon.id,
        pokemonName: selectedPokemon.name,
        status,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      resetForm();
      setIsModalVisible(false);
      Alert.alert("Success", "Pokédex entry added!");
    } catch (error) {
      Alert.alert("Error", "Failed to add entry");
      console.error(error);
    }
  };

  const handleDeleteEntry = (
    entryId: Id<"pokedexEntries">,
    pokemonName: string,
  ) => {
    Alert.alert("Delete Entry", `Remove ${pokemonName} from your Pokédex?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteEntry({ entryId });
          } catch (error) {
            Alert.alert("Error", "Failed to delete entry");
            console.error(error);
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setSelectedPokemon(null);
    setStatus("caught");
    setLocation("");
    setNotes("");
    setSearchQuery("");
    setSuggestions([]);
  };

  const filteredEntries =
    pokedexEntries?.filter(
      (entry) => filterStatus === "all" || entry.status === filterStatus,
    ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "seen":
        return "#8b5cf6";
      case "caught":
        return "#10b981";
      case "owned":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "seen":
        return "eye-outline";
      case "caught":
        return "checkmark-circle-outline";
      case "owned":
        return "star-outline";
      default:
        return "help-circle-outline";
    }
  };

  const handlePokemonSearch = (text: string) => {
    setSearchQuery(text);
    // Clear selection when typing
    if (
      selectedPokemon &&
      text.toLowerCase() !== selectedPokemon.name.toLowerCase()
    ) {
      setSelectedPokemon(null);
    }
  };

  const handleSelectPokemon = (pokemon: PokemonSearchResult) => {
    setSelectedPokemon(pokemon);
    setSearchQuery(pokemon.name);
    setSuggestions([]);
  };

  const renderEntry = ({ item }: { item: any }) => {
    const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.pokemonId}.png`;

    return (
      <View style={styles.entryCard}>
        <Image source={{ uri: imageUrl }} style={styles.pokemonImage} />
        <View style={styles.entryContent}>
          <View style={styles.entryHeader}>
            <Text style={styles.pokemonName}>
              #{item.pokemonId} {item.pokemonName}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.status) },
              ]}
            >
              <Ionicons
                name={getStatusIcon(item.status) as any}
                size={14}
                color="#fff"
              />
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
          {item.location && (
            <Text style={styles.entryDetail}>
              <Ionicons name="location-outline" size={14} color="#6b7280" />{" "}
              {item.location}
            </Text>
          )}
          {item.notes && <Text style={styles.entryNotes}>{item.notes}</Text>}
          {item.caughtAt && (
            <Text style={styles.entryDate}>
              {new Date(item.caughtAt).toLocaleDateString()}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteEntry(item._id, item.pokemonName)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Pokédex",
          headerShown: true,
          headerBackTitle: "Back",
        }}
      />

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {["all", "seen", "caught", "owned"].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                filterStatus === filter && styles.filterButtonActive,
              ]}
              onPress={() => setFilterStatus(filter as any)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterStatus === filter && styles.filterButtonTextActive,
                ]}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Entries List */}
      <FlatList
        data={filteredEntries}
        renderItem={renderEntry}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyText}>No entries yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to add Pokémon to your Pokédex
            </Text>
          </View>
        }
      />

      {/* Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsModalVisible(true)}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Add Entry Modal */}
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
              <Text style={styles.modalTitle}>Add Pokédex Entry</Text>
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
              <Text style={styles.label}>
                Pokémon <Text style={styles.required}>*</Text>
              </Text>

              {loadingPokemon ? (
                <View style={styles.loadingPokemon}>
                  <ActivityIndicator size="small" color="#ef4444" />
                  <Text style={styles.loadingText}>
                    Loading Pokémon for {run?.game}...
                  </Text>
                </View>
              ) : (
                <>
                  <TextInput
                    style={[
                      styles.input,
                      selectedPokemon && styles.inputSelected,
                    ]}
                    value={searchQuery}
                    onChangeText={handlePokemonSearch}
                    placeholder="Search Pokémon by name or ID"
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
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedPokemon(null);
                          setSearchQuery("");
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
                      <FlatList
                        data={suggestions}
                        keyExtractor={(item) => item.id.toString()}
                        scrollEnabled={false}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={styles.suggestionItem}
                            onPress={() => handleSelectPokemon(item)}
                          >
                            <Image
                              source={{
                                uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.id}.png`,
                              }}
                              style={styles.suggestionImage}
                            />
                            <Text style={styles.suggestionText}>
                              #{item.id} {item.name}
                            </Text>
                          </TouchableOpacity>
                        )}
                      />
                    </View>
                  )}

                  {gamePokemon.length > 0 &&
                    searchQuery &&
                    suggestions.length === 0 &&
                    !selectedPokemon && (
                      <Text style={styles.noResults}>
                        No Pokémon found in {run?.game} matching "{searchQuery}"
                      </Text>
                    )}
                </>
              )}

              <Text style={styles.label}>
                Status <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.statusSelector}>
                {["seen", "caught", "owned"].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusOption,
                      status === s && styles.statusOptionSelected,
                      { borderColor: getStatusColor(s) },
                    ]}
                    onPress={() => setStatus(s as any)}
                  >
                    <Ionicons
                      name={getStatusIcon(s) as any}
                      size={24}
                      color={status === s ? getStatusColor(s) : "#9ca3af"}
                    />
                    <Text
                      style={[
                        styles.statusOptionText,
                        status === s && { color: getStatusColor(s) },
                      ]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Location (Optional)</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="Where did you encounter/catch it?"
              />

              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any notes..."
                multiline
                numberOfLines={4}
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
                onPress={handleAddEntry}
              >
                <Text style={styles.saveButtonText}>Add Entry</Text>
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
  filterBar: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  filterButtonActive: {
    backgroundColor: "#ef4444",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  listContent: {
    padding: 16,
  },
  entryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  pokemonImage: {
    width: 60,
    height: 60,
    marginRight: 12,
  },
  entryContent: {
    flex: 1,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  pokemonName: {
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "capitalize",
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  entryDetail: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  entryNotes: {
    fontSize: 14,
    color: "#4b5563",
    marginTop: 4,
    fontStyle: "italic",
  },
  entryDate: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  deleteButton: {
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
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  loadingPokemon: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#6b7280",
  },
  inputSelected: {
    borderColor: "#10b981",
    borderWidth: 2,
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
  clearButton: {
    padding: 4,
  },
  suggestionsContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    marginTop: 8,
    maxHeight: 300,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  suggestionImage: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  suggestionText: {
    fontSize: 16,
    color: "#374151",
    textTransform: "capitalize",
  },
  noResults: {
    fontSize: 14,
    color: "#9ca3af",
    fontStyle: "italic",
    marginTop: 8,
    textAlign: "center",
  },
  statusSelector: {
    flexDirection: "row",
    gap: 12,
  },
  statusOption: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  statusOptionSelected: {
    backgroundColor: "#f9fafb",
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9ca3af",
    marginTop: 4,
    textTransform: "capitalize",
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
});

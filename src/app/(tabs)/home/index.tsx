import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { Id } from "../../../../convex/_generated/dataModel";

interface Run {
  _id: Id<"runs">;
  name: string;
  game: string;
  description?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

const GAME_OPTIONS = [
  { id: "red-blue", name: "Red/Blue" },
  { id: "yellow", name: "Yellow" },
  { id: "gold-silver", name: "Gold/Silver" },
  { id: "crystal", name: "Crystal" },
  { id: "ruby-sapphire", name: "Ruby/Sapphire" },
  { id: "emerald", name: "Emerald" },
  { id: "firered-leafgreen", name: "FireRed/LeafGreen" },
  { id: "diamond-pearl", name: "Diamond/Pearl" },
  { id: "platinum", name: "Platinum" },
  { id: "heartgold-soulsilver", name: "HeartGold/SoulSilver" },
  { id: "black-white", name: "Black/White" },
  { id: "black-2-white-2", name: "Black 2/White 2" },
  { id: "x-y", name: "X/Y" },
  { id: "omega-ruby-alpha-sapphire", name: "Omega Ruby/Alpha Sapphire" },
  { id: "sun-moon", name: "Sun/Moon" },
  { id: "ultra-sun-ultra-moon", name: "Ultra Sun/Ultra Moon" },
  { id: "lets-go-pikachu-lets-go-eevee", name: "Let's Go Pikachu/Eevee" },
  { id: "sword-shield", name: "Sword/Shield" },
  {
    id: "brilliant-diamond-shining-pearl",
    name: "Brilliant Diamond/Shining Pearl",
  },
  { id: "legends-arceus", name: "Legends: Arceus" },
  { id: "scarlet-violet", name: "Scarlet/Violet" },
];

export default function HomeScreen() {
  const router = useRouter();
  const runs = useQuery(api.runs.getUserRuns) as Run[] | undefined;
  const createRun = useMutation(api.runs.createRun);
  const updateRun = useMutation(api.runs.updateRun);
  const deleteRun = useMutation(api.runs.deleteRun);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRun, setEditingRun] = useState<Run | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    game: "",
    description: "",
    setAsActive: false,
  });

  const handleCreateOrUpdate = async () => {
    if (!formData.name.trim() || !formData.game) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      if (editingRun) {
        await updateRun({
          runId: editingRun._id,
          name: formData.name,
          game: formData.game,
          description: formData.description || undefined,
          isActive: formData.setAsActive,
        });
      } else {
        await createRun({
          name: formData.name,
          game: formData.game,
          description: formData.description || undefined,
          setAsActive: formData.setAsActive,
        });
      }
      resetForm();
      setIsModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "Failed to save run");
      console.error(error);
    }
  };

  const handleEdit = (run: Run) => {
    setEditingRun(run);
    setFormData({
      name: run.name,
      game: run.game,
      description: run.description || "",
      setAsActive: run.isActive,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (run: Run) => {
    console.log("handleDelete called for run:", run._id);

    // Use window.confirm for web, Alert.alert for native
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${run.name}"? This will also delete all Pokédex entries and party Pokémon.`,
      );

      if (confirmed) {
        console.log("Delete confirmed, executing delete...");
        deleteRun({ runId: run._id })
          .then((result) => {
            console.log("Delete successful:", result);
            alert("Run deleted successfully");
          })
          .catch((error) => {
            console.error("Delete error:", error);
            alert(`Failed to delete run: ${error?.message || error}`);
          });
      } else {
        console.log("Delete cancelled");
      }
    } else {
      Alert.alert(
        "Delete Run",
        `Are you sure you want to delete "${run.name}"? This will also delete all Pokédex entries and party Pokémon.`,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => console.log("Delete cancelled"),
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              console.log("Delete confirmed, executing delete...");
              deleteRun({ runId: run._id })
                .then((result) => {
                  console.log("Delete successful:", result);
                  Alert.alert("Success", "Run deleted successfully");
                })
                .catch((error) => {
                  console.error("Delete error:", error);
                  Alert.alert(
                    "Error",
                    `Failed to delete run: ${error?.message || error}`,
                  );
                });
            },
          },
        ],
      );
    }
  };

  const handleSetActive = async (run: Run) => {
    try {
      await updateRun({
        runId: run._id,
        isActive: true,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to set active run");
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      game: "",
      description: "",
      setAsActive: false,
    });
    setEditingRun(null);
  };

  const renderRunCard = ({ item }: { item: Run }) => {
    const gameName =
      GAME_OPTIONS.find((g) => g.id === item.game)?.name || item.game;

    return (
      <View style={[styles.runCard, item.isActive && styles.activeRunCard]}>
        <View style={styles.runHeader}>
          <View style={styles.runTitleContainer}>
            <Text style={styles.runName}>{item.name}</Text>
            {item.isActive && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            )}
          </View>
          <View style={styles.runActions}>
            {!item.isActive && (
              <TouchableOpacity
                onPress={() => handleSetActive(item)}
                style={styles.iconButton}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={24}
                  color="#10b981"
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => handleEdit(item)}
              style={styles.iconButton}
            >
              <Ionicons name="create-outline" size={24} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(item)}
              style={styles.iconButton}
            >
              <Ionicons name="trash-outline" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.runGame}>{gameName}</Text>
        {item.description && (
          <Text style={styles.runDescription}>{item.description}</Text>
        )}

        <View style={styles.runFooter}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/home/run/[runId]",
                params: { runId: item._id },
              })
            }
          >
            <Text style={styles.viewButtonText}>View Details</Text>
            <Ionicons name="arrow-forward" size={16} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        <Text style={styles.runDate}>
          Created {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Runs</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setIsModalVisible(true);
          }}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {runs === undefined ? (
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      ) : runs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="game-controller-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyText}>No runs yet</Text>
          <Text style={styles.emptySubtext}>
            Create your first run to start tracking your Pokémon journey!
          </Text>
        </View>
      ) : (
        <FlatList
          data={runs}
          renderItem={renderRunCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          resetForm();
          setIsModalVisible(false);
        }}
      >
        <SafeAreaView style={styles.modalOverlay} edges={["bottom"]}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingRun ? "Edit Run" : "New Run"}
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
              <Text style={styles.label}>
                Run Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
                placeholder="e.g., Scarlet Nuzlocke"
              />

              <Text style={styles.label}>
                Game <Text style={styles.required}>*</Text>
              </Text>
              <ScrollView style={styles.gameSelector}>
                {GAME_OPTIONS.map((game) => (
                  <TouchableOpacity
                    key={game.id}
                    style={[
                      styles.gameOption,
                      formData.game === game.id && styles.gameOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, game: game.id })}
                  >
                    <Text
                      style={[
                        styles.gameOptionText,
                        formData.game === game.id &&
                          styles.gameOptionTextSelected,
                      ]}
                    >
                      {game.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) =>
                  setFormData({ ...formData, description: text })
                }
                placeholder="Add notes about this run..."
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() =>
                  setFormData({
                    ...formData,
                    setAsActive: !formData.setAsActive,
                  })
                }
              >
                <Ionicons
                  name={
                    formData.setAsActive ? "checkbox-outline" : "square-outline"
                  }
                  size={24}
                  color="#3b82f6"
                />
                <Text style={styles.checkboxLabel}>Set as active run</Text>
              </TouchableOpacity>
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
                onPress={handleCreateOrUpdate}
              >
                <Text style={styles.saveButtonText}>
                  {editingRun ? "Update" : "Create"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#ef4444",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 20,
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
  listContent: {
    padding: 16,
  },
  runCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeRunCard: {
    borderWidth: 2,
    borderColor: "#10b981",
  },
  runHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  runTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  runName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  activeBadge: {
    backgroundColor: "#d1fae5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: "#065f46",
    fontSize: 12,
    fontWeight: "600",
  },
  runActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  runGame: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  runDescription: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 12,
  },
  runFooter: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 12,
    marginTop: 12,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewButtonText: {
    color: "#3b82f6",
    fontWeight: "600",
  },
  runDate: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 8,
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
  gameSelector: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 8,
  },
  gameOption: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  gameOptionSelected: {
    backgroundColor: "#dbeafe",
  },
  gameOptionText: {
    fontSize: 14,
    color: "#4b5563",
  },
  gameOptionTextSelected: {
    color: "#1e40af",
    fontWeight: "600",
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
});

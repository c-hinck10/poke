import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default function RunDetailsScreen() {
  const { runId } = useLocalSearchParams<{ runId: Id<"runs"> }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "pokedex" | "party">(
    "overview",
  );

  const run = useQuery(api.runs.getRun, { runId });
  const pokedexStats = useQuery(api.pokedex.getPokedexStats, { runId });
  const partyPokemon = useQuery(api.party.getPartyPokemon, { runId });

  if (!run) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Run Details" }} />
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: run.name,
          headerShown: true,
          headerBackTitle: "Runs",
        }}
      />

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "overview" && styles.activeTab]}
          onPress={() => setActiveTab("overview")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "overview" && styles.activeTabText,
            ]}
          >
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "pokedex" && styles.activeTab]}
          onPress={() => setActiveTab("pokedex")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "pokedex" && styles.activeTabText,
            ]}
          >
            Pokédex
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "party" && styles.activeTab]}
          onPress={() => setActiveTab("party")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "party" && styles.activeTabText,
            ]}
          >
            Party
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === "overview" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Run Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Game:</Text>
                <Text style={styles.infoValue}>{run.game}</Text>
              </View>
              {run.description && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Description:</Text>
                  <Text style={styles.infoValue}>{run.description}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <Text style={styles.infoValue}>
                  {run.isActive ? "Active" : "Inactive"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Created:</Text>
                <Text style={styles.infoValue}>
                  {new Date(run.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="book-outline" size={32} color="#3b82f6" />
                <Text style={styles.statValue}>{pokedexStats?.total || 0}</Text>
                <Text style={styles.statLabel}>Total Pokédex</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="eye-outline" size={32} color="#8b5cf6" />
                <Text style={styles.statValue}>{pokedexStats?.seen || 0}</Text>
                <Text style={styles.statLabel}>Seen</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={32}
                  color="#10b981"
                />
                <Text style={styles.statValue}>
                  {pokedexStats?.caught || 0}
                </Text>
                <Text style={styles.statLabel}>Caught</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="star-outline" size={32} color="#f59e0b" />
                <Text style={styles.statValue}>
                  {partyPokemon?.length || 0}
                </Text>
                <Text style={styles.statLabel}>Party</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/home/run/pokedex/[runId]",
                  params: { runId },
                })
              }
            >
              <Ionicons name="add-circle-outline" size={24} color="#3b82f6" />
              <Text style={styles.actionButtonText}>Add Pokédex Entry</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/home/run/party/[runId]",
                  params: { runId },
                })
              }
            >
              <Ionicons name="people-outline" size={24} color="#3b82f6" />
              <Text style={styles.actionButtonText}>Manage Party</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "pokedex" && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pokédex Progress</Text>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/home/run/pokedex/[runId]",
                    params: { runId },
                  })
                }
              >
                <Ionicons name="add-circle-outline" size={28} color="#ef4444" />
              </TouchableOpacity>
            </View>
            {pokedexStats && (
              <View style={styles.progressCard}>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Seen</Text>
                  <Text style={styles.progressValue}>{pokedexStats.seen}</Text>
                </View>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Caught</Text>
                  <Text style={styles.progressValue}>
                    {pokedexStats.caught}
                  </Text>
                </View>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Owned</Text>
                  <Text style={styles.progressValue}>{pokedexStats.owned}</Text>
                </View>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Total</Text>
                  <Text style={styles.progressValue}>{pokedexStats.total}</Text>
                </View>
              </View>
            )}
            <Text style={styles.helpText}>
              Tap the + button to add Pokémon to your Pokédex
            </Text>
          </View>
        )}

        {activeTab === "party" && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Party Pokémon</Text>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/home/run/party/[runId]",
                    params: { runId },
                  })
                }
              >
                <Ionicons name="add-circle-outline" size={28} color="#ef4444" />
              </TouchableOpacity>
            </View>
            {partyPokemon && partyPokemon.length > 0 ? (
              partyPokemon.map((pokemon) => (
                <View key={pokemon._id} style={styles.partyCard}>
                  <View style={styles.partyHeader}>
                    <Text style={styles.partyName}>
                      {pokemon.nickname || pokemon.pokemonName}
                    </Text>
                    <Text style={styles.partyLevel}>Lv. {pokemon.level}</Text>
                  </View>
                  {pokemon.nickname && (
                    <Text style={styles.partySpecies}>
                      ({pokemon.pokemonName})
                    </Text>
                  )}
                  {pokemon.moves && pokemon.moves.length > 0 && (
                    <View style={styles.movesContainer}>
                      {pokemon.moves.map((move, index) => (
                        <Text key={index} style={styles.moveText}>
                          • {move}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>No party Pokémon yet</Text>
                <Text style={styles.emptySubtext}>
                  Tap the + button to add Pokémon to your party
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
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
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#ef4444",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  activeTabText: {
    color: "#ef4444",
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  infoLabel: {
    fontSize: 14,
    color: "#6b7280",
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
    textTransform: "capitalize",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    width: "47%",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  actionButton: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  progressCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  progressLabel: {
    fontSize: 16,
    color: "#4b5563",
  },
  progressValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  helpText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 8,
  },
  partyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  partyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  partyName: {
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  partyLevel: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "600",
  },
  partySpecies: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
    textTransform: "capitalize",
  },
  movesContainer: {
    marginTop: 8,
  },
  moveText: {
    fontSize: 14,
    color: "#4b5563",
    textTransform: "capitalize",
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4b5563",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 4,
  },
});

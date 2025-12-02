import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from "react-native";

export type DetailSection =
  | "types"
  | "stats"
  | "abilities"
  | "physicalStats"
  | "typeEffectiveness"
  | "description"
  | "evolution"
  | "moves"
  | "eggGroups"
  | "locations"
  | "heldItems"
  | "captureInfo";

interface DetailSectionSelectorProps {
  selectedSections: DetailSection[];
  onToggleSection: (section: DetailSection) => void;
}

const SECTION_LABELS: Record<DetailSection, string> = {
  types: "Types",
  stats: "Base Stats",
  abilities: "Abilities",
  physicalStats: "Physical Stats",
  typeEffectiveness: "Type Effectiveness",
  description: "Description",
  evolution: "Evolution Chain",
  moves: "Moves",
  eggGroups: "Egg Groups & Breeding",
  locations: "Catch Locations",
  heldItems: "Held Items",
  captureInfo: "Capture Info",
};

export default function DetailSectionSelector({
  selectedSections,
  onToggleSection,
}: DetailSectionSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const allSections: DetailSection[] = [
    "types",
    "stats",
    "abilities",
    "physicalStats",
    "typeEffectiveness",
    "description",
    "evolution",
    "moves",
    "eggGroups",
    "locations",
    "heldItems",
    "captureInfo",
  ];

  return (
    <View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.buttonText}>⚙️ Sections</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Sections to Display</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sectionList}>
              {allSections.map((section) => {
                const isSelected = selectedSections.includes(section);
                return (
                  <TouchableOpacity
                    key={section}
                    style={styles.sectionItem}
                    onPress={() => onToggleSection(section)}
                  >
                    <Text style={styles.sectionLabel}>
                      {SECTION_LABELS[section]}
                    </Text>
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected,
                      ]}
                    >
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "600",
  },
  sectionList: {
    padding: 20,
  },
  sectionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  sectionLabel: {
    fontSize: 16,
    color: "#374151",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  checkmark: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

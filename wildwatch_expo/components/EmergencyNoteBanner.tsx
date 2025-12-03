import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function EmergencyNoteBanner() {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="warning" size={20} color="#D4AF37" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Important Note</Text>
        <Text style={styles.message}>
          In case of an emergency or immediate danger, please contact Campus
          Security directly at{" "}
          <Text style={styles.highlight}>+1 (555) 123-4567</Text> or call{" "}
          <Text style={styles.highlight}>911</Text>.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#D4AF37",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    backgroundColor: "rgba(212, 175, 55, 0.2)",
    borderRadius: 20,
    padding: 8,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  message: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
  },
  highlight: {
    fontWeight: "600",
    color: "#800000",
  },
});

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, ROLES } from "../config/constants";

const DashboardScreen = () => {
  const navigation = useNavigation();
  const user = useSelector((state) => state.auth.user);
  const isOperator = user?.role === ROLES.OPERATOR;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome, {user?.fullName || user?.username}
        </Text>
        <Text style={styles.roleText}>{user?.role}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate("Scan")}
        >
          <Ionicons name="qr-code" size={40} color={COLORS.primary} />
          <Text style={styles.actionText}>Scan QR Code</Text>
        </TouchableOpacity>

        {isOperator && (
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("CreateMaterial")}
          >
            <Ionicons name="add-circle" size={40} color={COLORS.success} />
            <Text style={styles.actionText}>Create Material</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate("Inventory")}
        >
          <Ionicons name="cube" size={40} color={COLORS.info} />
          <Text style={styles.actionText}>Inventory</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  header: {
    backgroundColor: COLORS.white,
    padding: 20,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 4,
  },
  roleText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  actions: {
    padding: 15,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    width: "48%",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.dark,
    textAlign: "center",
  },
});

export default DashboardScreen;



import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { useSelector } from "react-redux";
import api from "../config/api";
import { API_ENDPOINTS, COLORS, MATERIAL_STATUS } from "../config/constants";
import moment from "moment";

const InventoryScreen = () => {
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    loadExpiryAlerts();
  }, []);

  const loadExpiryAlerts = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.INVENTORY.EXPIRY_ALERTS, {
        params: { days: 30 },
      });
      setExpiryAlerts(response.data.alerts || []);
    } catch (error) {
      console.error("Error loading expiry alerts:", error);
      Alert.alert("Error", "Failed to load expiry alerts");
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilExpiry = (expDate) => {
    const days = moment(expDate).diff(moment(), "days");
    return days;
  };

  const getExpiryColor = (days) => {
    if (days < 7) return COLORS.danger;
    if (days < 15) return COLORS.warning;
    if (days < 30) return COLORS.info;
    return COLORS.success;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadExpiryAlerts} />
        }
      >
      <View style={styles.header}>
        <Text style={styles.title}>Inventory Management</Text>
        <Text style={styles.subtitle}>Expiry Alerts (Next 30 Days)</Text>
      </View>

      {expiryAlerts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No materials expiring in the next 30 days
          </Text>
        </View>
      ) : (
        expiryAlerts.map((material) => {
          const daysUntilExpiry = getDaysUntilExpiry(material.exp_date);
          const expiryColor = getExpiryColor(daysUntilExpiry);

          return (
            <View key={material.material_id} style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <Text style={styles.materialName}>{material.item_name}</Text>
                <View
                  style={[styles.daysBadge, { backgroundColor: expiryColor }]}
                >
                  <Text style={styles.daysText}>
                    {daysUntilExpiry} {daysUntilExpiry === 1 ? "day" : "days"}
                  </Text>
                </View>
              </View>

              <View style={styles.alertInfo}>
                <Text style={styles.infoText}>
                  <Text style={styles.infoLabel}>Item Code:</Text>{" "}
                  {material.item_code}
                </Text>
                <Text style={styles.infoText}>
                  <Text style={styles.infoLabel}>Batch:</Text>{" "}
                  {material.batch_lot_number}
                </Text>
                <Text style={styles.infoText}>
                  <Text style={styles.infoLabel}>Status:</Text>{" "}
                  {material.current_status}
                </Text>
                <Text style={styles.infoText}>
                  <Text style={styles.infoLabel}>Remaining Qty:</Text>{" "}
                  {material.remaining_quantity}
                </Text>
                <Text style={styles.infoText}>
                  <Text style={styles.infoLabel}>Expiry Date:</Text>{" "}
                  {moment(material.exp_date).format("DD MMM YYYY")}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: "center",
  },
  alertCard: {
    backgroundColor: COLORS.white,
    margin: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  materialName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
    flex: 1,
  },
  daysBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  daysText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 12,
  },
  alertInfo: {
    marginTop: 10,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.dark,
    marginBottom: 5,
  },
  infoLabel: {
    fontWeight: "600",
    color: COLORS.gray,
  },
});

export default InventoryScreen;


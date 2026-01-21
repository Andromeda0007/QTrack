import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import api from "../config/api";
import { API_ENDPOINTS, COLORS } from "../config/constants";

export default function AdminApprovalScreen() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingUserId, setProcessingUserId] = useState(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.USERS.PENDING);
      setPendingUsers(response.data.pendingUsers || []);
    } catch (error) {
      console.error("Fetch pending users error:", error);
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to fetch pending users"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprove = async (userId, username) => {
    Alert.alert(
      "Approve User",
      `Approve ${username}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            try {
              setProcessingUserId(userId);
              await api.post(`${API_ENDPOINTS.USERS.APPROVE}/${userId}/approve`);
              Alert.alert("Success", `${username} has been approved`);
              fetchPendingUsers();
            } catch (error) {
              console.error("Approve error:", error);
              Alert.alert(
                "Error",
                error.response?.data?.error || "Failed to approve user"
              );
            } finally {
              setProcessingUserId(null);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleReject = async (userId, username) => {
    Alert.alert(
      "Reject User",
      `Reject ${username}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              setProcessingUserId(userId);
              await api.post(`${API_ENDPOINTS.USERS.REJECT}/${userId}/reject`);
              Alert.alert("Success", `${username} has been rejected`);
              fetchPendingUsers();
            } catch (error) {
              console.error("Reject error:", error);
              Alert.alert(
                "Error",
                error.response?.data?.error || "Failed to reject user"
              );
            } finally {
              setProcessingUserId(null);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderUserItem = ({ item }) => {
    const isProcessing = processingUserId === item.user_id;

    return (
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.full_name}</Text>
          <Text style={styles.userDetail}>Username: {item.username}</Text>
          <Text style={styles.userDetail}>Email: {item.email}</Text>
          <Text style={styles.userDetail}>Role: {item.role_name}</Text>
          <Text style={styles.userDetail}>
            Registered: {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.approveButton, isProcessing && styles.buttonDisabled]}
            onPress={() => handleApprove(item.user_id, item.username)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.approveButtonText}>Approve</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rejectButton, isProcessing && styles.buttonDisabled]}
            onPress={() => handleReject(item.user_id, item.username)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.rejectButtonText}>Reject</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading pending approvals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pending Approvals</Text>
        <Text style={styles.headerSubtitle}>
          {pendingUsers.length} user(s) awaiting approval
        </Text>
      </View>

      {pendingUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No pending approvals</Text>
          <Text style={styles.emptySubtext}>
            All user registrations have been processed
          </Text>
        </View>
      ) : (
        <FlatList
          data={pendingUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.user_id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchPendingUsers();
              }}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.light,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.gray,
  },
  header: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 5,
  },
  listContent: {
    padding: 15,
  },
  userCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    marginBottom: 15,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 5,
  },
  userDetail: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 3,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  approveButton: {
    flex: 1,
    backgroundColor: COLORS.success,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  approveButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  rejectButton: {
    flex: 1,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  rejectButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.gray,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
  },
});

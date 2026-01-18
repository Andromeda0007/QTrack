import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { createMaterial } from "../store/materialSlice";
import { COLORS } from "../config/constants";
import DateTimePicker from "@react-native-community/datetimepicker";

const CreateMaterialScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { loading } = useSelector((state) => state.materials);

  const [formData, setFormData] = useState({
    itemCode: "",
    itemName: "",
    batchLotNumber: "",
    grnNumber: "",
    receivedTotalQuantity: "",
    containerQuantity: "",
    supplierName: "",
    manufacturerName: "",
    dateOfReceipt: new Date(),
    mfgDate: null,
    expDate: null,
  });

  const [showDatePicker, setShowDatePicker] = useState({
    receipt: false,
    mfg: false,
    exp: false,
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (field, event, selectedDate) => {
    setShowDatePicker((prev) => ({ ...prev, [field]: false }));
    if (selectedDate) {
      setFormData((prev) => ({ ...prev, [field]: selectedDate }));
    }
  };

  const validateForm = () => {
    const required = [
      "itemCode",
      "itemName",
      "batchLotNumber",
      "grnNumber",
      "receivedTotalQuantity",
      "containerQuantity",
      "supplierName",
      "manufacturerName",
    ];

    for (const field of required) {
      if (!formData[field] || formData[field].toString().trim() === "") {
        Alert.alert("Validation Error", `${field} is required`);
        return false;
      }
    }

    if (
      isNaN(formData.receivedTotalQuantity) ||
      parseFloat(formData.receivedTotalQuantity) <= 0
    ) {
      Alert.alert(
        "Validation Error",
        "Received Total Quantity must be a positive number"
      );
      return false;
    }

    if (
      isNaN(formData.containerQuantity) ||
      parseFloat(formData.containerQuantity) <= 0
    ) {
      Alert.alert(
        "Validation Error",
        "Container Quantity must be a positive number"
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const submitData = {
      ...formData,
      receivedTotalQuantity: parseFloat(formData.receivedTotalQuantity),
      containerQuantity: parseFloat(formData.containerQuantity),
      dateOfReceipt: formData.dateOfReceipt.toISOString().split("T")[0],
      mfgDate: formData.mfgDate
        ? formData.mfgDate.toISOString().split("T")[0]
        : null,
      expDate: formData.expDate
        ? formData.expDate.toISOString().split("T")[0]
        : null,
    };

    try {
      const result = await dispatch(createMaterial(submitData));

      if (createMaterial.fulfilled.match(result)) {
        Alert.alert(
          "Success",
          "Material created successfully! QR code generated.",
          [
            {
              text: "View Material",
              onPress: () => {
                navigation.navigate("MaterialDetail");
              },
            },
            {
              text: "Create Another",
              onPress: () => {
                // Reset form
                setFormData({
                  itemCode: "",
                  itemName: "",
                  batchLotNumber: "",
                  grnNumber: "",
                  receivedTotalQuantity: "",
                  containerQuantity: "",
                  supplierName: "",
                  manufacturerName: "",
                  dateOfReceipt: new Date(),
                  mfgDate: null,
                  expDate: null,
                });
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", result.payload || "Failed to create material");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Item Code *</Text>
        <TextInput
          style={styles.input}
          value={formData.itemCode}
          onChangeText={(value) => handleInputChange("itemCode", value)}
          placeholder="Enter item code"
        />

        <Text style={styles.label}>Item Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.itemName}
          onChangeText={(value) => handleInputChange("itemName", value)}
          placeholder="Enter item name"
        />

        <Text style={styles.label}>Batch/Lot Number *</Text>
        <TextInput
          style={styles.input}
          value={formData.batchLotNumber}
          onChangeText={(value) => handleInputChange("batchLotNumber", value)}
          placeholder="Enter batch/lot number"
        />

        <Text style={styles.label}>GRN Number *</Text>
        <TextInput
          style={styles.input}
          value={formData.grnNumber}
          onChangeText={(value) => handleInputChange("grnNumber", value)}
          placeholder="Enter GRN number"
        />

        <Text style={styles.label}>Received Total Quantity *</Text>
        <TextInput
          style={styles.input}
          value={formData.receivedTotalQuantity}
          onChangeText={(value) =>
            handleInputChange("receivedTotalQuantity", value)
          }
          placeholder="Enter total quantity"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Container/Bag/Drum Quantity *</Text>
        <TextInput
          style={styles.input}
          value={formData.containerQuantity}
          onChangeText={(value) =>
            handleInputChange("containerQuantity", value)
          }
          placeholder="Enter container quantity"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Supplier Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.supplierName}
          onChangeText={(value) => handleInputChange("supplierName", value)}
          placeholder="Enter supplier name"
        />

        <Text style={styles.label}>Manufacturer Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.manufacturerName}
          onChangeText={(value) => handleInputChange("manufacturerName", value)}
          placeholder="Enter manufacturer name"
        />

        <Text style={styles.label}>Date of Receipt *</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() =>
            setShowDatePicker((prev) => ({ ...prev, receipt: true }))
          }
        >
          <Text style={styles.dateText}>
            {formData.dateOfReceipt.toLocaleDateString()}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Manufacturing Date (Optional)</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker((prev) => ({ ...prev, mfg: true }))}
        >
          <Text style={styles.dateText}>
            {formData.mfgDate
              ? formData.mfgDate.toLocaleDateString()
              : "Select date"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Expiry Date (Optional)</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker((prev) => ({ ...prev, exp: true }))}
        >
          <Text style={styles.dateText}>
            {formData.expDate
              ? formData.expDate.toLocaleDateString()
              : "Select date"}
          </Text>
        </TouchableOpacity>

        {showDatePicker.receipt && (
          <DateTimePicker
            value={formData.dateOfReceipt}
            mode="date"
            display="default"
            onChange={(event, date) => handleDateChange("receipt", event, date)}
          />
        )}

        {showDatePicker.mfg && (
          <DateTimePicker
            value={formData.mfgDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => handleDateChange("mfg", event, date)}
          />
        )}

        {showDatePicker.exp && (
          <DateTimePicker
            value={formData.expDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => handleDateChange("exp", event, date)}
          />
        )}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitButtonText}>
              Create Material & Generate QR
            </Text>
          )}
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
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.dark,
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.light,
  },
  dateButton: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.light,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.dark,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CreateMaterialScreen;



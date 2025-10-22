import React, { useMemo, useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../contexts/AppContext";
import {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  getCurrencySymbol,
} from "../utils/theme";
import BottomModal from "./BottomModal";
import ToastService from "../services/ToastService";

const { width: screenWidth } = Dimensions.get("window");

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  visible,
  onClose,
}) => {
  const { data, addTransaction } = useApp();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const incomeCategories = useMemo(
    () => data.categories.filter((c) => c.type === "income"),
    [data.categories],
  );
  const expenseCategories = useMemo(
    () => data.categories.filter((c) => c.type === "expense"),
    [data.categories],
  );
  const currentCategories = useMemo(
    () => (type === "income" ? incomeCategories : expenseCategories),
    [type, incomeCategories, expenseCategories],
  );

  // Quick amount buttons - more compact
  const quickAmounts = [10, 25, 50, 100, 200, 500];

  const handleSubmit = useCallback(async () => {
    if (!amount || !description || !category) {
      ToastService.error("Error", "Please fill in all fields");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      ToastService.error("Error", "Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      await addTransaction({
        amount: amountNum,
        description: description.trim(),
        category,
        type,
        date,
      });

      // Reset form
      setAmount("");
      setDescription("");
      setCategory("");
      setType("expense");
      setDate(new Date().toISOString().split("T")[0]);

      ToastService.success("Success", "Transaction added successfully");
      onClose();
    } catch (error) {
      ToastService.error("Error", "Failed to add transaction");
    } finally {
      setLoading(false);
    }
  }, [amount, description, category, addTransaction, type, date, onClose]);

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, "");
    return numericValue;
  };

  const handleQuickAmount = useCallback((quick: number) => {
    setAmount(quick.toString());
  }, []);

  return (
    <BottomModal
      visible={visible}
      onClose={onClose}
      title="Add Transaction"
      showSaveButton={true}
      onSave={handleSubmit}
      saveButtonDisabled={!amount || !description || !category}
      isLoading={loading}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {/* Transaction Type Toggle */}
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === "expense" && styles.typeButtonActive,
            ]}
            onPress={() => setType("expense")}
          >
            <Ionicons
              name="remove-circle-outline"
              size={20}
              color={type === "expense" ? colors.white : colors.textSecondary}
            />
            <Text
              style={[
                styles.typeButtonText,
                type === "expense" && styles.typeButtonTextActive,
              ]}
            >
              Expense
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === "income" && styles.typeButtonActive,
            ]}
            onPress={() => setType("income")}
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={type === "income" ? colors.white : colors.textSecondary}
            />
            <Text
              style={[
                styles.typeButtonText,
                type === "income" && styles.typeButtonTextActive,
              ]}
            >
              Income
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Amount</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>
              {getCurrencySymbol(data.settings.currency)}
            </Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={(text) => setAmount(formatCurrency(text))}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              returnKeyType="next"
            />
          </View>

          {/* Quick Amount Buttons */}
          <View style={styles.quickAmounts}>
            {quickAmounts.map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                style={styles.quickAmountButton}
                onPress={() => handleQuickAmount(quickAmount)}
              >
                <Text style={styles.quickAmountText}>{quickAmount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={styles.textInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description"
            placeholderTextColor={colors.textSecondary}
            returnKeyType="next"
          />
        </View>

        {/* Category Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Category</Text>
          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                !category && styles.categoryButtonPlaceholder,
              ]}
            >
              {category || "Select category"}
            </Text>
            <Ionicons
              name="chevron-down"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Category Picker */}
          {showCategoryPicker && (
            <View style={styles.categoryPicker}>
              {currentCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryOption,
                    category === cat.name && styles.categoryOptionSelected,
                  ]}
                  onPress={() => {
                    setCategory(cat.name);
                    setShowCategoryPicker(false);
                  }}
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: cat.color },
                    ]}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={16}
                      color={colors.white}
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryOptionText,
                      category === cat.name &&
                        styles.categoryOptionTextSelected,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Date Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Date</Text>
          <TextInput
            style={styles.textInput}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textSecondary}
            returnKeyType="done"
          />
        </View>
      </ScrollView>
    </BottomModal>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  typeToggle: {
    flexDirection: "row",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: 4,
    marginBottom: spacing.lg,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
  },
  typeButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: "600",
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  typeButtonTextActive: {
    color: colors.white,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.body.fontSize,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  currencySymbol: {
    fontSize: typography.h3.fontSize,
    fontWeight: "600",
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: typography.h3.fontSize,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  quickAmounts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  quickAmountButton: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  quickAmountText: {
    fontSize: typography.body.fontSize,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  textInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  categoryButtonText: {
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
  },
  categoryButtonPlaceholder: {
    color: colors.textSecondary,
  },
  categoryPicker: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  categoryOptionSelected: {
    backgroundColor: colors.primary + "20",
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  categoryOptionText: {
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
    flex: 1,
  },
  categoryOptionTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
});

export default AddTransactionModal;

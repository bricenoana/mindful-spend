import type { Metadata } from "expo-router/server";
import { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import {
  addDays,
  CATEGORIES,
  Category,
  createDefaultState,
  DAILY_SAVINGS,
  Expense,
  formatMoney,
  formatShortDate,
  formatWeekday,
  getNoSpendDays,
  getRecentDays,
  isBudgetState,
  isValidDateKey,
  localDateKey,
} from "@/lib/budget";

const STORAGE_KEY = "mindful-spend-v1";

const CATEGORY_COLORS: Record<Category, string> = {
  Food: "#D96C4C",
  Groceries: "#5D8D64",
  Miscellaneous: "#7772A8",
};

export function generateMetadata(): Metadata {
  return {
    title: "Mindful Spend",
    description: "Daily expense tracking, spending trends, and savings goals.",
  };
}

export default function Index() {
  const { width } = useWindowDimensions();
  const compact = width < 780;
  const [budget, setBudget] = useState(createDefaultState);
  const [hydrated, setHydrated] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("Food");
  const [date, setDate] = useState(localDateKey);
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [rewardName, setRewardName] = useState("Switch 2");
  const [rewardAmount, setRewardAmount] = useState("550");
  const [goalSaved, setGoalSaved] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(localDateKey);

  useEffect(() => {
    const loadStoredBudget = globalThis.setTimeout(() => {
      if (Platform.OS === "web") {
        const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const parsed: unknown = JSON.parse(stored);
            if (isBudgetState(parsed)) {
              setBudget(parsed);
              setRewardName(parsed.reward.name);
              setRewardAmount(String(parsed.reward.amount));
            }
          } catch {
            // Ignore unreadable local data and start with a clean tracker.
          }
        }
      }
      setHydrated(true);
    }, 0);

    return () => globalThis.clearTimeout(loadStoredBudget);
  }, []);

  useEffect(() => {
    if (hydrated && Platform.OS === "web") {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(budget));
    }
  }, [budget, hydrated]);

  const today = localDateKey();
  const currentMonth = today.slice(0, 7);
  const monthExpenses = budget.expenses.filter((expense) =>
    expense.date.startsWith(currentMonth),
  );
  const monthTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categoryTotals = CATEGORIES.map((item) => ({
    category: item,
    total: monthExpenses
      .filter((expense) => expense.category === item)
      .reduce((sum, expense) => sum + expense.amount, 0),
  }));
  const weekEnd = addDays(today, -weekOffset * 7);
  const recentDays = getRecentDays(7, weekEnd);
  const trend = recentDays.map((day) => ({
    day,
    total: budget.expenses
      .filter((expense) => expense.date === day)
      .reduce((sum, expense) => sum + expense.amount, 0),
  }));
  const maxTrend = Math.max(...trend.map((item) => item.total), 1);
  const selectedDayExpenses = budget.expenses
    .filter((expense) => expense.date === selectedDay)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const selectedDayTotal = selectedDayExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );
  const noSpendDays = getNoSpendDays(
    budget.expenses,
    budget.trackingStarted,
    today,
  );
  const savings = noSpendDays.length * DAILY_SAVINGS;
  const rewardTarget = Math.max(budget.reward.amount, 1);
  const rewardProgress = Math.min(savings / rewardTarget, 1);
  const sortedExpenses = [...budget.expenses].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );

  function addExpense() {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError("Enter an amount greater than $0.");
      return;
    }
    if (!isValidDateKey(date) || date > today) {
      setFormError("Enter a valid date that is not in the future.");
      return;
    }

    const expense: Expense = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      amount: Math.round(parsedAmount * 100) / 100,
      category,
      date,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };

    setBudget((current) => ({
      ...current,
      trackingStarted:
        date < current.trackingStarted ? date : current.trackingStarted,
      expenses: [...current.expenses, expense],
    }));
    setAmount("");
    setNote("");
    setFormError("");
  }

  function deleteExpense(id: string) {
    setBudget((current) => ({
      ...current,
      expenses: current.expenses.filter((expense) => expense.id !== id),
    }));
  }

  function saveGoal() {
    const target = Number(rewardAmount);
    if (!rewardName.trim() || !Number.isFinite(target) || target <= 0) return;
    setBudget((current) => ({
      ...current,
      reward: { name: rewardName.trim(), amount: Math.round(target * 100) / 100 },
    }));
    setGoalSaved(true);
    globalThis.setTimeout(() => setGoalSaved(false), 1600);
  }

  function moveWeek(amount: number) {
    const nextOffset = Math.max(0, weekOffset + amount);
    setWeekOffset(nextOffset);
    setSelectedDay(addDays(today, -nextOffset * 7));
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <View style={styles.shell}>
        <View style={styles.header}>
          <View style={styles.wordmarkRow}>
            <View style={styles.mark} />
            <Text style={styles.wordmark}>MINDFUL SPEND</Text>
          </View>
        </View>

        <View style={[styles.statGrid, compact && styles.stack]}>
          <StatCard label="THIS MONTH" value={formatMoney(monthTotal)} />
          <StatCard label="SAVED" value={formatMoney(savings)} accent />
          <StatCard label="NO-SPEND DAYS" value={String(noSpendDays.length)} />
        </View>

        <View style={[styles.mainGrid, compact && styles.stack]}>
          <View style={[styles.primaryColumn, compact && styles.fullWidth]}>
            <Section title="Add expense">
              <View style={[styles.formRow, compact && styles.stack]}>
                <Field label="AMOUNT" style={styles.flexField}>
                  <View style={styles.moneyInputWrap}>
                    <Text style={styles.moneyPrefix}>$</Text>
                    <TextInput
                      accessibilityLabel="Expense amount"
                      inputMode="decimal"
                      onChangeText={setAmount}
                      onSubmitEditing={addExpense}
                      placeholder="0.00"
                      placeholderTextColor="#9A988F"
                      style={styles.moneyInput}
                      value={amount}
                    />
                  </View>
                </Field>
                <Field label="DATE" style={styles.flexField}>
                  <TextInput
                    accessibilityLabel="Expense date"
                    onChangeText={setDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9A988F"
                    style={styles.input}
                    value={date}
                  />
                </Field>
              </View>

              <Field label="CATEGORY">
                <View style={styles.categoryRow}>
                  {CATEGORIES.map((item) => {
                    const selected = category === item;
                    return (
                      <Pressable
                        accessibilityRole="button"
                        key={item}
                        onPress={() => setCategory(item)}
                        style={[
                          styles.categoryButton,
                          selected && {
                            backgroundColor: CATEGORY_COLORS[item],
                            borderColor: CATEGORY_COLORS[item],
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryButtonText,
                            selected && styles.categoryButtonTextSelected,
                          ]}
                        >
                          {item}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Field>

              <Field label="NOTE">
                <TextInput
                  accessibilityLabel="Expense note"
                  maxLength={80}
                  onChangeText={setNote}
                  onSubmitEditing={addExpense}
                  placeholder="Optional"
                  placeholderTextColor="#9A988F"
                  style={styles.input}
                  value={note}
                />
              </Field>

              {formError ? <Text style={styles.error}>{formError}</Text> : null}
              <Pressable
                accessibilityRole="button"
                onPress={addExpense}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Add expense</Text>
              </Pressable>
            </Section>

            <Section
              headerAction={
                <View style={styles.weekNav}>
                  <Pressable
                    accessibilityLabel="Show previous week"
                    accessibilityRole="button"
                    onPress={() => moveWeek(1)}
                    style={styles.weekNavButton}
                  >
                    <Text style={styles.weekNavButtonText}>‹</Text>
                  </Pressable>
                  <Text style={styles.weekRange}>
                    {formatShortDate(recentDays[0])}–{formatShortDate(recentDays[6])}
                  </Text>
                  <Pressable
                    accessibilityLabel="Show next week"
                    accessibilityRole="button"
                    accessibilityState={{ disabled: weekOffset === 0 }}
                    disabled={weekOffset === 0}
                    onPress={() => moveWeek(-1)}
                    style={[
                      styles.weekNavButton,
                      weekOffset === 0 && styles.weekNavButtonDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.weekNavButtonText,
                        weekOffset === 0 && styles.weekNavButtonTextDisabled,
                      ]}
                    >
                      ›
                    </Text>
                  </Pressable>
                </View>
              }
              title="7-day trend"
            >
              <View style={styles.chart}>
                {trend.map((item) => {
                  const barHeight = item.total
                    ? 20 + (item.total / maxTrend) * 112
                    : 4;
                  const selected = selectedDay === item.day;
                  return (
                    <Pressable
                      accessibilityLabel={`${formatWeekday(item.day)}, ${formatShortDate(item.day)}, ${formatMoney(item.total)}. View expenses`}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      key={item.day}
                      onPress={() => setSelectedDay(item.day)}
                      style={[
                        styles.chartColumn,
                        selected && styles.chartColumnSelected,
                      ]}
                    >
                      <Text style={styles.chartAmount}>
                        {item.total ? formatMoney(item.total) : "—"}
                      </Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.bar,
                            selected && styles.barSelected,
                            { height: barHeight },
                          ]}
                        />
                      </View>
                      <Text style={styles.chartDay}>{formatWeekday(item.day)}</Text>
                      <Text style={styles.chartDate}>{formatShortDate(item.day)}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.dayBreakdown}>
                <View style={styles.dayBreakdownHeader}>
                  <Text style={styles.dayBreakdownTitle}>
                    {formatWeekday(selectedDay)}, {formatShortDate(selectedDay)}
                  </Text>
                  <Text style={styles.dayBreakdownTotal}>
                    {formatMoney(selectedDayTotal)}
                  </Text>
                </View>
                {selectedDayExpenses.length ? (
                  selectedDayExpenses.map((expense) => (
                    <View key={expense.id} style={styles.dayExpenseRow}>
                      <View
                        style={[
                          styles.categoryDot,
                          { backgroundColor: CATEGORY_COLORS[expense.category] },
                        ]}
                      />
                      <View style={styles.expenseDetails}>
                        <Text style={styles.expenseCategory}>{expense.category}</Text>
                        {expense.note ? (
                          <Text numberOfLines={2} style={styles.expenseMeta}>
                            {expense.note}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={styles.expenseAmount}>
                        {formatMoney(expense.amount)}
                      </Text>
                      <Pressable
                        accessibilityLabel={`Delete ${expense.category} expense`}
                        accessibilityRole="button"
                        onPress={() => deleteExpense(expense.id)}
                        style={styles.deleteButton}
                      >
                        <Text style={styles.deleteButtonText}>×</Text>
                      </Pressable>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyDay}>No expenses for this day.</Text>
                )}
              </View>
            </Section>

            <Section title="Recent expenses">
              {sortedExpenses.length ? (
                sortedExpenses.slice(0, 8).map((expense, index) => (
                  <View
                    key={expense.id}
                    style={[
                      styles.expenseRow,
                      index === 0 && styles.expenseRowFirst,
                    ]}
                  >
                    <View
                      style={[
                        styles.categoryDot,
                        { backgroundColor: CATEGORY_COLORS[expense.category] },
                      ]}
                    />
                    <View style={styles.expenseDetails}>
                      <Text style={styles.expenseCategory}>{expense.category}</Text>
                      <Text numberOfLines={1} style={styles.expenseMeta}>
                        {formatShortDate(expense.date)}
                        {expense.note ? ` · ${expense.note}` : ""}
                      </Text>
                    </View>
                    <Text style={styles.expenseAmount}>
                      {formatMoney(expense.amount)}
                    </Text>
                    <Pressable
                      accessibilityLabel={`Delete ${expense.category} expense`}
                      accessibilityRole="button"
                      onPress={() => deleteExpense(expense.id)}
                      style={styles.deleteButton}
                    >
                      <Text style={styles.deleteButtonText}>×</Text>
                    </Pressable>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyState}>No expenses yet.</Text>
              )}
            </Section>
          </View>

          <View style={[styles.sideColumn, compact && styles.fullWidth]}>
            <Section title="This month">
              {categoryTotals.map((item) => {
                const share = monthTotal ? item.total / monthTotal : 0;
                return (
                  <View key={item.category} style={styles.totalRow}>
                    <View style={styles.totalHeader}>
                      <View style={styles.totalLabelWrap}>
                        <View
                          style={[
                            styles.categoryDot,
                            { backgroundColor: CATEGORY_COLORS[item.category] },
                          ]}
                        />
                        <Text style={styles.totalLabel}>{item.category}</Text>
                      </View>
                      <Text style={styles.totalValue}>{formatMoney(item.total)}</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            backgroundColor: CATEGORY_COLORS[item.category],
                            width: `${share * 100}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </Section>

            <Section dark title="Savings goal">
              <Text style={styles.rewardName}>{budget.reward.name}</Text>
              <Text style={styles.rewardTotal}>
                {formatMoney(savings)} / {formatMoney(budget.reward.amount)}
              </Text>
              <View style={styles.rewardTrack}>
                <View
                  style={[styles.rewardFill, { width: `${rewardProgress * 100}%` }]}
                />
              </View>
              <View style={styles.savingsMath}>
                <Text style={styles.savingsMathText}>
                  {noSpendDays.length} × {formatMoney(DAILY_SAVINGS)}
                </Text>
                <Text style={styles.savingsMathText}>
                  {Math.round(rewardProgress * 100)}%
                </Text>
              </View>
              <View style={styles.goalDivider} />
              <Field dark label="REWARD">
                <TextInput
                  accessibilityLabel="Reward name"
                  onChangeText={setRewardName}
                  placeholder="Reward"
                  placeholderTextColor="#83968B"
                  style={[styles.input, styles.darkInput]}
                  value={rewardName}
                />
              </Field>
              <Field dark label="TARGET">
                <View style={[styles.moneyInputWrap, styles.darkInput]}>
                  <Text style={styles.darkMoneyPrefix}>$</Text>
                  <TextInput
                    accessibilityLabel="Reward target"
                    inputMode="decimal"
                    onChangeText={setRewardAmount}
                    placeholder="550"
                    placeholderTextColor="#83968B"
                    style={[styles.moneyInput, styles.darkMoneyInput]}
                    value={rewardAmount}
                  />
                </View>
              </Field>
              <Pressable
                accessibilityRole="button"
                onPress={saveGoal}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>
                  {goalSaved ? "Saved" : "Save goal"}
                </Text>
              </Pressable>
            </Section>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={[styles.statCard, accent && styles.statCardAccent]}>
      <Text style={[styles.eyebrow, accent && styles.eyebrowAccent]}>{label}</Text>
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text>
    </View>
  );
}

function Section({
  title,
  children,
  dark = false,
  headerAction,
}: {
  title: string;
  children: React.ReactNode;
  dark?: boolean;
  headerAction?: React.ReactNode;
}) {
  return (
    <View style={[styles.section, dark && styles.darkSection]}>
      <View style={styles.sectionHeadingRow}>
        <Text style={[styles.sectionTitle, dark && styles.darkSectionTitle]}>
          {title}
        </Text>
        {headerAction}
      </View>
      {children}
    </View>
  );
}

function Field({
  label,
  children,
  dark = false,
  style,
}: {
  label: string;
  children: React.ReactNode;
  dark?: boolean;
  style?: object;
}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={[styles.fieldLabel, dark && styles.darkFieldLabel]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: "#F3F0E7" },
  pageContent: { minHeight: "100%", paddingBottom: 64 },
  shell: {
    alignSelf: "center",
    maxWidth: 1180,
    paddingHorizontal: 22,
    width: "100%",
  },
  header: { paddingBottom: 22, paddingTop: 42 },
  wordmarkRow: { alignItems: "center", flexDirection: "row", gap: 9 },
  mark: { backgroundColor: "#315E46", borderRadius: 99, height: 10, width: 10 },
  wordmark: {
    color: "#315E46",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.7,
  },
  statGrid: { flexDirection: "row", gap: 14 },
  stack: { flexDirection: "column" },
  statCard: {
    backgroundColor: "#FBFAF6",
    borderColor: "#DFDDD4",
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    padding: 22,
  },
  statCardAccent: { backgroundColor: "#315E46", borderColor: "#315E46" },
  eyebrow: {
    color: "#77766F",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  eyebrowAccent: { color: "#CBE0D1" },
  statValue: {
    color: "#172B22",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginTop: 10,
  },
  statValueAccent: { color: "#FFFFFF" },
  mainGrid: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 18,
    marginTop: 18,
  },
  primaryColumn: { flex: 1.65, gap: 18, minWidth: 0 },
  sideColumn: { flex: 1, gap: 18, minWidth: 0 },
  fullWidth: {
    flexBasis: "auto",
    flexGrow: 0,
    flexShrink: 0,
    width: "100%",
  },
  section: {
    backgroundColor: "#FBFAF6",
    borderColor: "#DFDDD4",
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
  },
  darkSection: { backgroundColor: "#172B22", borderColor: "#172B22" },
  sectionTitle: {
    color: "#172B22",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  sectionHeadingRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  darkSectionTitle: { color: "#FFFFFF" },
  formRow: { flexDirection: "row", gap: 12 },
  field: { marginBottom: 15 },
  flexField: { flex: 1 },
  fieldLabel: {
    color: "#6F706A",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginBottom: 7,
  },
  darkFieldLabel: { color: "#A9BDAF" },
  input: {
    backgroundColor: "#F5F2EA",
    borderColor: "#DAD7CE",
    borderRadius: 11,
    borderWidth: 1,
    color: "#172B22",
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  moneyInputWrap: {
    alignItems: "center",
    backgroundColor: "#F5F2EA",
    borderColor: "#DAD7CE",
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 48,
  },
  moneyPrefix: {
    color: "#5D665F",
    fontSize: 17,
    fontWeight: "700",
    paddingLeft: 14,
  },
  moneyInput: {
    color: "#172B22",
    flex: 1,
    fontSize: 16,
    minHeight: 46,
    paddingHorizontal: 8,
  },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryButton: {
    borderColor: "#D4D1C8",
    borderRadius: 99,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  categoryButtonText: { color: "#555A56", fontSize: 13, fontWeight: "700" },
  categoryButtonTextSelected: { color: "#FFFFFF" },
  error: { color: "#B34837", fontSize: 13, marginBottom: 12 },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#315E46",
    borderRadius: 11,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  chart: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 7,
    height: 205,
  },
  chartColumn: {
    alignItems: "center",
    borderRadius: 10,
    flex: 1,
    height: "100%",
    justifyContent: "flex-end",
    minWidth: 0,
    paddingHorizontal: 3,
    paddingVertical: 4,
  },
  chartColumnSelected: { backgroundColor: "#EDF2EB" },
  chartAmount: { color: "#6D6D67", fontSize: 10, marginBottom: 6 },
  barTrack: { height: 136, justifyContent: "flex-end", width: "72%" },
  bar: {
    backgroundColor: "#6C9874",
    borderRadius: 6,
    minHeight: 4,
    width: "100%",
  },
  barSelected: { backgroundColor: "#315E46" },
  chartDay: {
    color: "#313E37",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 7,
  },
  chartDate: { color: "#8B8A83", fontSize: 9, marginTop: 2 },
  weekNav: { alignItems: "center", flexDirection: "row", gap: 8 },
  weekNavButton: {
    alignItems: "center",
    backgroundColor: "#F0EEE6",
    borderColor: "#DAD7CE",
    borderRadius: 9,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  weekNavButtonDisabled: { backgroundColor: "#F7F5EF", borderColor: "#E8E5DD" },
  weekNavButtonText: {
    color: "#315E46",
    fontSize: 25,
    fontWeight: "700",
    lineHeight: 27,
  },
  weekNavButtonTextDisabled: { color: "#BBB9B1" },
  weekRange: { color: "#696A64", fontSize: 11, fontWeight: "700" },
  dayBreakdown: {
    borderTopColor: "#E3E0D8",
    borderTopWidth: 1,
    marginTop: 18,
    paddingTop: 18,
  },
  dayBreakdownHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dayBreakdownTitle: { color: "#27372F", fontSize: 15, fontWeight: "800" },
  dayBreakdownTotal: { color: "#172B22", fontSize: 15, fontWeight: "800" },
  dayExpenseRow: {
    alignItems: "center",
    borderTopColor: "#ECE9E1",
    borderTopWidth: 1,
    flexDirection: "row",
    minHeight: 58,
  },
  emptyDay: { color: "#85837B", fontSize: 13, paddingTop: 12 },
  expenseRow: {
    alignItems: "center",
    borderTopColor: "#E3E0D8",
    borderTopWidth: 1,
    flexDirection: "row",
    minHeight: 62,
  },
  expenseRowFirst: { borderTopWidth: 0 },
  categoryDot: { borderRadius: 99, height: 9, marginRight: 11, width: 9 },
  expenseDetails: { flex: 1, minWidth: 0 },
  expenseCategory: { color: "#27372F", fontSize: 14, fontWeight: "800" },
  expenseMeta: { color: "#7B7A73", fontSize: 12, marginTop: 3 },
  expenseAmount: {
    color: "#172B22",
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 10,
  },
  deleteButton: {
    alignItems: "center",
    height: 34,
    justifyContent: "center",
    marginLeft: 6,
    width: 34,
  },
  deleteButtonText: { color: "#9B817A", fontSize: 23, lineHeight: 24 },
  emptyState: { color: "#85837B", fontSize: 14, paddingVertical: 16 },
  totalRow: { marginBottom: 20 },
  totalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 9,
  },
  totalLabelWrap: { alignItems: "center", flexDirection: "row" },
  totalLabel: { color: "#404941", fontSize: 14, fontWeight: "700" },
  totalValue: { color: "#172B22", fontSize: 14, fontWeight: "800" },
  progressTrack: {
    backgroundColor: "#E5E2DA",
    borderRadius: 99,
    height: 7,
    overflow: "hidden",
  },
  progressFill: { borderRadius: 99, height: "100%" },
  rewardName: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  rewardTotal: { color: "#C9D7CE", fontSize: 14, fontWeight: "700", marginTop: 8 },
  rewardTrack: {
    backgroundColor: "#385044",
    borderRadius: 99,
    height: 10,
    marginTop: 20,
    overflow: "hidden",
  },
  rewardFill: { backgroundColor: "#BDD7AF", borderRadius: 99, height: "100%" },
  savingsMath: { flexDirection: "row", justifyContent: "space-between", marginTop: 9 },
  savingsMathText: { color: "#9FB3A7", fontSize: 11, fontWeight: "700" },
  goalDivider: {
    backgroundColor: "#355044",
    height: 1,
    marginBottom: 20,
    marginTop: 22,
  },
  darkInput: {
    backgroundColor: "#233A30",
    borderColor: "#40584C",
    color: "#FFFFFF",
  },
  darkMoneyPrefix: {
    color: "#B7C8BD",
    fontSize: 17,
    fontWeight: "700",
    paddingLeft: 14,
  },
  darkMoneyInput: { color: "#FFFFFF" },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#BDD7AF",
    borderRadius: 11,
    paddingVertical: 13,
  },
  secondaryButtonText: { color: "#173326", fontSize: 14, fontWeight: "800" },
});

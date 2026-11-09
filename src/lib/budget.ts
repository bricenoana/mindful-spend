export const CATEGORIES = ["Food", "Groceries", "Miscellaneous"] as const;

export type Category = (typeof CATEGORIES)[number];

export type Expense = {
  id: string;
  amount: number;
  category: Category;
  date: string;
  note: string;
  createdAt: string;
};

export type RewardGoal = {
  name: string;
  amount: number;
};

export type BudgetState = {
  expenses: Expense[];
  reward: RewardGoal;
  trackingStarted: string;
};

export const DAILY_SAVINGS = 15;

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function isValidDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return localDateKey(parseDateKey(value)) === value;
}

export function addDays(dateKey: string, amount: number) {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + amount);
  return localDateKey(date);
}

export function getRecentDays(count: number, endDate = localDateKey()) {
  return Array.from({ length: count }, (_, index) =>
    addDays(endDate, index - count + 1),
  );
}

export function getNoSpendDays(
  expenses: Expense[],
  trackingStarted: string,
  today = localDateKey(),
) {
  const blockedDates = new Set(
    expenses
      .filter(
        (expense) =>
          expense.category === "Food" || expense.category === "Miscellaneous",
      )
      .map((expense) => expense.date),
  );
  const dates: string[] = [];
  let cursor = trackingStarted;

  while (cursor < today) {
    if (!blockedDates.has(cursor)) dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatShortDate(dateKey: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parseDateKey(dateKey));
}

export function formatWeekday(dateKey: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(
    parseDateKey(dateKey),
  );
}

export function createDefaultState(): BudgetState {
  return {
    expenses: [],
    reward: { name: "Switch 2", amount: 550 },
    trackingStarted: localDateKey(),
  };
}

export function isBudgetState(value: unknown): value is BudgetState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<BudgetState>;
  return (
    Array.isArray(candidate.expenses) &&
    typeof candidate.trackingStarted === "string" &&
    !!candidate.reward &&
    typeof candidate.reward.name === "string" &&
    typeof candidate.reward.amount === "number"
  );
}

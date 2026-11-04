import { StyleSheet, Text, View } from "react-native";
import type { Metadata } from "expo-router/server";

export function generateMetadata(): Metadata {
  return {
    title: "Mindful Spend",
    description:
      "Track daily expenses, understand food spending, and build better saving habits.",
  };
}

export default function Index() {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>YOUR MONEY, MADE CLEAR</Text>
      </View>
      <Text style={styles.title}>Mindful Spend</Text>
      <Text style={styles.subtitle}>
        Track daily expenses, understand what food is really costing you, and
        make room for the things you want to save for.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>FIRST MILESTONE</Text>
        <Text style={styles.cardTitle}>Build the daily expense log</Text>
        <Text style={styles.cardBody}>
          Amount, category, date, and an optional note — fast enough to use
          every day.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#F5F1E8",
    paddingHorizontal: 28,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#D9E7D1",
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 22,
  },
  badgeText: {
    color: "#31523A",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
  },
  title: {
    color: "#173326",
    fontSize: 48,
    fontWeight: "800",
    letterSpacing: -1.8,
    lineHeight: 50,
  },
  subtitle: {
    color: "#53645A",
    fontSize: 18,
    lineHeight: 27,
    marginTop: 16,
    maxWidth: 520,
  },
  card: {
    backgroundColor: "#173326",
    borderRadius: 24,
    marginTop: 42,
    padding: 24,
  },
  cardLabel: {
    color: "#A9C69B",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 10,
  },
  cardBody: {
    color: "#D8E2DB",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
});

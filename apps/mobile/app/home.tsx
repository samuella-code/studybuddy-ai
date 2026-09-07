import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Chip, ProgressBar, Text } from "react-native-paper";

import { useAuthStore } from "../store/auth";

const subjects = ["Mathematics", "Computer Science", "Biology"];

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  async function handleLogout() {
    await clearSession();
    router.replace("/");
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <View style={styles.greeting}>
            <Text variant="headlineMedium" style={styles.title}>
              Good to see you, {user?.name?.split(" ")[0] ?? "Learner"} 👋
            </Text>
            <Text style={styles.subtitle}>Let&apos;s make today a productive study day.</Text>
          </View>
          <Button onPress={handleLogout} compact>Log out</Button>
        </View>

        <Card style={styles.hero} mode="contained">
          <Card.Content>
            <Text variant="titleLarge" style={styles.heroTitle}>Your AI tutor is ready</Text>
            <Text style={styles.heroText}>Ask questions, get simple explanations, and practice until it clicks.</Text>
            <Button mode="contained" icon="microphone" onPress={() => router.push("/tutor")} style={styles.primaryButton} contentStyle={styles.buttonContent}>
              Talk to StudyBuddy
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Today&apos;s focus</Text>
          <Text style={styles.percent}>0%</Text>
        </View>
        <ProgressBar progress={0} style={styles.progress} />
        <Text style={styles.helper}>Start a study session to build your progress.</Text>

        <Text variant="titleMedium" style={styles.sectionTitle}>Your subjects</Text>
        <View style={styles.chips}>
          {subjects.map((subject) => <Chip key={subject} icon="book-open-variant" style={styles.chip}>{subject}</Chip>)}
          <Chip icon="plus" onPress={() => router.push("/subjects")} style={styles.chip}>Add subject</Chip>
        </View>

        <Text variant="titleMedium" style={styles.sectionTitle}>Study tools</Text>
        <View style={styles.grid}>
          <Card style={styles.toolCard} onPress={() => router.push("/study-plan")}><Card.Content><Text variant="titleMedium">📅 Study plan</Text><Text style={styles.statLabel}>Organize your week</Text></Card.Content></Card>
          <Card style={styles.toolCard} onPress={() => router.push("/quiz")}><Card.Content><Text variant="titleMedium">🧠 Quick quiz</Text><Text style={styles.statLabel}>Test what you know</Text></Card.Content></Card>
          <Card style={styles.toolCard} onPress={() => router.push("/flashcards")}><Card.Content><Text variant="titleMedium">🗂 Flashcards</Text><Text style={styles.statLabel}>Review key ideas</Text></Card.Content></Card>
        </View>

        <View style={styles.grid}>
          <Card style={styles.statCard}><Card.Content><Text variant="headlineSmall">0</Text><Text style={styles.statLabel}>Study sessions</Text></Card.Content></Card>
          <Card style={styles.statCard}><Card.Content><Text variant="headlineSmall">0</Text><Text style={styles.statLabel}>Quizzes completed</Text></Card.Content></Card>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 48 },
  content: { width: "100%", maxWidth: 900, alignSelf: "center", gap: 14 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  greeting: { flex: 1 },
  title: { fontWeight: "800", marginTop: 16 },
  subtitle: { opacity: 0.68, lineHeight: 22, marginBottom: 8 },
  hero: { borderRadius: 24, marginBottom: 8 },
  heroTitle: { fontWeight: "800", marginBottom: 8 },
  heroText: { opacity: 0.72, lineHeight: 22, marginBottom: 18 },
  primaryButton: { borderRadius: 14, alignSelf: "flex-start" },
  buttonContent: { paddingVertical: 5, paddingHorizontal: 8 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  sectionTitle: { fontWeight: "700", marginTop: 8 },
  percent: { opacity: 0.65, marginTop: 8 },
  progress: { height: 8, borderRadius: 8, marginTop: 4 },
  helper: { opacity: 0.6, fontSize: 13 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: { marginBottom: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  toolCard: { flex: 1, minWidth: 220, borderRadius: 18 },
  statCard: { flex: 1, minWidth: 160, borderRadius: 18 },
  statLabel: { opacity: 0.65, marginTop: 4 },
});

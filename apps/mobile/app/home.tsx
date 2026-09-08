import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Chip, ProgressBar, Text } from "react-native-paper";

import { getProgress, getSubjects, type Progress } from "../services/api";
import { loadSubjects } from "../services/subjects-storage";
import { useAuthStore } from "../store/auth";

const DEFAULT_SUBJECTS = ["Mathematics", "Computer Science", "Biology"];
const DAILY_GOAL = 60;

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [subjects, setSubjects] = useState<string[]>(DEFAULT_SUBJECTS);
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    void Promise.all([
      getSubjects(accessToken).then((items) => { if (items.length) setSubjects(items.map((item) => item.name)); }).catch(() => loadSubjects().then((items) => items.length ? setSubjects(items) : undefined)),
      getProgress(accessToken).then(setProgress).catch(() => undefined),
    ]);
  }, [accessToken]);

  async function handleLogout() { await clearSession(); router.replace("/"); }
  const minutes = progress?.total_minutes ?? 0;
  const today = new Date().toISOString().slice(0, 10);
  const todayMinutes = progress?.weekly_activity?.[today] ?? 0;
  const goalProgress = Math.min(todayMinutes / DAILY_GOAL, 1);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <View style={styles.greeting}>
            <Text variant="headlineMedium" style={styles.title}>Good to see you, {user?.name?.split(" ")[0] ?? "Learner"} 👋</Text>
            <Text style={styles.subtitle}>Let's make today a productive study day.</Text>
          </View>
          <Button onPress={handleLogout} compact>Log out</Button>
        </View>

        <Card style={styles.hero} mode="contained">
          <Card.Content>
            <Text variant="titleLarge" style={styles.heroTitle}>Your AI tutor is ready</Text>
            <Text style={styles.heroText}>Ask questions, get simple explanations, and practice until it clicks.</Text>
            <Button mode="contained" icon="microphone" onPress={() => router.push("/tutor")} style={styles.primaryButton} contentStyle={styles.buttonContent}>Talk to StudyBuddy</Button>
          </Card.Content>
        </Card>

        <View style={styles.sectionHeader}><Text variant="titleMedium" style={styles.sectionTitle}>Today's focus</Text><Text style={styles.percent}>{Math.round(goalProgress * 100)}%</Text></View>
        <ProgressBar progress={goalProgress} style={styles.progress} />
        <Text style={styles.helper}>{todayMinutes} of {DAILY_GOAL} minutes studied today.</Text>

        <Text variant="titleMedium" style={styles.sectionTitle}>Your subjects</Text>
        <View style={styles.chips}>{subjects.map((subject) => <Chip key={subject} icon="book-open-variant" style={styles.chip}>{subject}</Chip>)}<Chip icon="plus" onPress={() => router.push("/subjects")} style={styles.chip}>Add subject</Chip></View>

        <Text variant="titleMedium" style={styles.sectionTitle}>Study tools</Text>
        <View style={styles.grid}>
          <Card style={styles.toolCard} onPress={() => router.push("/study-plan")}><Card.Content><Text variant="titleMedium">📅 Study plan</Text><Text style={styles.statLabel}>Organize your week</Text></Card.Content></Card>
          <Card style={styles.toolCard} onPress={() => router.push("/quiz")}><Card.Content><Text variant="titleMedium">🧠 Quick quiz</Text><Text style={styles.statLabel}>Test what you know</Text></Card.Content></Card>
          <Card style={styles.toolCard} onPress={() => router.push("/flashcards")}><Card.Content><Text variant="titleMedium">🗂 Flashcards</Text><Text style={styles.statLabel}>Review key ideas</Text></Card.Content></Card>
        </View>

        <View style={styles.grid}>
          <Card style={styles.statCard}><Card.Content><Text variant="headlineSmall">{progress?.current_streak ?? 0} 🔥</Text><Text style={styles.statLabel}>Study streak</Text></Card.Content></Card>
          <Card style={styles.statCard}><Card.Content><Text variant="headlineSmall">{minutes}</Text><Text style={styles.statLabel}>Minutes studied</Text></Card.Content></Card>
          <Card style={styles.statCard}><Card.Content><Text variant="headlineSmall">{progress?.quizzes_taken ?? 0}</Text><Text style={styles.statLabel}>Quizzes completed</Text></Card.Content></Card>
          <Card style={styles.statCard}><Card.Content><Text variant="headlineSmall">{progress?.quiz_score ?? 0}%</Text><Text style={styles.statLabel}>Latest quiz</Text></Card.Content></Card>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 48 }, content: { width: "100%", maxWidth: 900, alignSelf: "center", gap: 14 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }, greeting: { flex: 1 }, title: { fontWeight: "800", marginTop: 16 }, subtitle: { opacity: 0.68, lineHeight: 22, marginBottom: 8 },
  hero: { borderRadius: 24, marginBottom: 8 }, heroTitle: { fontWeight: "800", marginBottom: 8 }, heroText: { opacity: 0.72, lineHeight: 22, marginBottom: 18 }, primaryButton: { borderRadius: 14, alignSelf: "flex-start" }, buttonContent: { paddingVertical: 5, paddingHorizontal: 8 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }, sectionTitle: { fontWeight: "700", marginTop: 8 }, percent: { opacity: 0.65, marginTop: 8 }, progress: { height: 8, borderRadius: 8, marginTop: 4 }, helper: { opacity: 0.6, fontSize: 13 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }, chip: { marginBottom: 2 }, grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 }, toolCard: { flex: 1, minWidth: 220, borderRadius: 18 }, statCard: { flex: 1, minWidth: 160, borderRadius: 18 }, statLabel: { opacity: 0.65, marginTop: 4 },
});

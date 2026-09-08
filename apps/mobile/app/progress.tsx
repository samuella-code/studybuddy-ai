import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, ProgressBar, Text } from "react-native-paper";

import { getProgress, getStudyHistory, type Progress as ProgressData } from "../services/api";
import { useAuthStore } from "../store/auth";

export default function ProgressScreen() {
  const token = useAuthStore((state) => state.accessToken);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [history, setHistory] = useState<Array<{ id: string; subject: string; topic: string | null; minutes: number; started_at: string }>>([]);
  useEffect(() => { if (!token) return; void Promise.all([getProgress(token).then(setProgress), getStudyHistory(token).then(setHistory)]).catch(() => undefined); }, [token]);
  const activity = progress?.weekly_activity ?? {};
  const maxDay = Math.max(1, ...Object.values(activity));

  return <ScrollView contentContainerStyle={styles.container}><View style={styles.content}>
    <Button icon="arrow-left" onPress={() => router.back()} compact>Back</Button>
    <Text variant="headlineMedium" style={styles.title}>Your progress 📈</Text>
    <Text style={styles.subtitle}>See how your consistency and quiz performance are growing.</Text>
    <View style={styles.grid}>
      <Card style={styles.stat}><Card.Content><Text variant="headlineSmall">{progress?.total_minutes ?? 0}</Text><Text style={styles.muted}>Minutes studied</Text></Card.Content></Card>
      <Card style={styles.stat}><Card.Content><Text variant="headlineSmall">{progress?.current_streak ?? 0} 🔥</Text><Text style={styles.muted}>Day streak</Text></Card.Content></Card>
      <Card style={styles.stat}><Card.Content><Text variant="headlineSmall">{progress?.quiz_score ?? 0}%</Text><Text style={styles.muted}>Latest quiz</Text></Card.Content></Card>
      <Card style={styles.stat}><Card.Content><Text variant="headlineSmall">{progress?.quizzes_taken ?? 0}</Text><Text style={styles.muted}>Quizzes</Text></Card.Content></Card>
    </View>
    <Card style={styles.card}><Card.Content><Text variant="titleMedium" style={styles.bold}>Weekly activity</Text>{Object.entries(activity).slice(-7).map(([day, minutes]) => <View key={day} style={styles.day}><View style={styles.dayLabel}><Text>{new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" })}</Text><Text>{minutes} min</Text></View><ProgressBar progress={minutes / maxDay} style={styles.bar} /></View>)}</Card.Content></Card>
    <Card style={styles.card}><Card.Content><Text variant="titleMedium" style={styles.bold}>Recent study sessions</Text>{history.slice(0, 6).map((item) => <View key={item.id} style={styles.session}><View><Text style={styles.bold}>{item.subject}</Text><Text style={styles.muted}>{item.topic ?? "Focused study"}</Text></View><Text>{item.minutes} min</Text></View>)}{history.length === 0 && <Text style={styles.muted}>Complete a study session to see it here.</Text>}</Card.Content></Card>
  </View></ScrollView>;
}

const styles = StyleSheet.create({ container: { padding: 20, paddingBottom: 48 }, content: { width: "100%", maxWidth: 900, alignSelf: "center", gap: 12 }, title: { fontWeight: "800", marginTop: 4 }, subtitle: { opacity: 0.68, lineHeight: 22 }, grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 }, stat: { flex: 1, minWidth: 180, borderRadius: 18 }, card: { borderRadius: 20, marginTop: 4 }, bold: { fontWeight: "800" }, muted: { opacity: 0.68, marginTop: 4 }, day: { marginTop: 14 }, dayLabel: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }, bar: { height: 8, borderRadius: 8 }, session: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(128,128,128,0.16)" }, });

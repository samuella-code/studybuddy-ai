import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Card, Text, Button } from "react-native-paper";
import { getStudyHistory } from "../services/api";
import { useAuthStore } from "../store/auth";

export default function StudyHistoryScreen() {
  const token = useAuthStore((state) => state.accessToken);
  const [items, setItems] = useState<Array<{ id: string; subject: string; topic: string | null; minutes: number; started_at: string }>>([]);
  useEffect(() => { if (token) void getStudyHistory(token).then(setItems).catch(() => undefined); }, [token]);
  return <ScrollView contentContainerStyle={styles.container}><View style={styles.content}>
    <Button icon="arrow-left" onPress={() => router.back()} compact>Back</Button>
    <Text variant="headlineMedium" style={styles.title}>Study history</Text>
    <Text style={styles.muted}>Your recent focused study sessions.</Text>
    {items.map((item) => <Card key={item.id} style={styles.card}><Card.Content><View style={styles.row}><View><Text variant="titleMedium" style={styles.bold}>{item.subject}</Text><Text style={styles.muted}>{item.topic ?? "Focused study"}</Text><Text style={styles.date}>{new Date(item.started_at).toLocaleString()}</Text></View><Text variant="titleMedium">{item.minutes} min</Text></View></Card.Content></Card>)}
    {!items.length && <Card style={styles.card}><Card.Content><Text>No study sessions yet.</Text><Text style={styles.muted}>Start a focus session and your history will appear here.</Text></Card.Content></Card>}
  </View></ScrollView>;
}
const styles = StyleSheet.create({ container: { padding: 20, paddingBottom: 48 }, content: { width: "100%", maxWidth: 820, alignSelf: "center", gap: 12 }, title: { fontWeight: "800", marginTop: 4 }, muted: { opacity: 0.68 }, card: { borderRadius: 18 }, row: { flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "center" }, bold: { fontWeight: "800" }, date: { opacity: 0.55, marginTop: 8, fontSize: 12 } });

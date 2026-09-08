import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Button, Card, Text, TextInput } from "react-native-paper";

import { recordStudySession } from "../services/api";
import { useAuthStore } from "../store/auth";

export default function StudySessionScreen() {
  const token = useAuthStore((state) => state.accessToken);
  const [subject, setSubject] = useState("Computer Science");
  const [topic, setTopic] = useState("");
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!running) return; const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000); return () => clearInterval(timer); }, [running]);
  useEffect(() => { if (seconds === 0) setRunning(false); }, [seconds]);
  const minutes = Math.floor(seconds / 60); const secs = seconds % 60;
  async function finish() { if (!token) return; const studied = Math.max(1, Math.round((25 * 60 - seconds) / 60)); setSaving(true); try { await recordStudySession(subject.trim(), studied, token, topic.trim() || undefined); Alert.alert("Session saved", `${studied} minute${studied === 1 ? "" : "s"} added to your progress.`); router.replace("/home"); } catch (error) { Alert.alert("Could not save session", error instanceof Error ? error.message : "Please try again."); } finally { setSaving(false); } }
  return <View style={styles.container}><Card style={styles.card}><Card.Content>
    <Button icon="arrow-left" onPress={() => router.back()} compact>Back</Button>
    <Text variant="headlineMedium" style={styles.title}>Focus session</Text>
    <Text style={styles.muted}>Put your phone down, focus, and let StudyBuddy track the session.</Text>
    <TextInput mode="outlined" label="Subject" value={subject} onChangeText={setSubject} style={styles.input} />
    <TextInput mode="outlined" label="Topic (optional)" value={topic} onChangeText={setTopic} style={styles.input} />
    <Text variant="displaySmall" style={styles.timer}>{String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}</Text>
    <Button mode="contained" onPress={() => setRunning((value) => !value)} style={styles.button}>{running ? "Pause" : "Start focus"}</Button>
    <Button mode="outlined" loading={saving} disabled={saving || running || seconds === 25 * 60} onPress={() => void finish()} style={styles.button}>Finish & save</Button>
  </Card.Content></Card></View>;
}
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: "center", padding: 20 }, card: { width: "100%", maxWidth: 650, alignSelf: "center", borderRadius: 24 }, title: { fontWeight: "800", marginTop: 4 }, muted: { opacity: 0.68, lineHeight: 22, marginBottom: 20 }, input: { marginBottom: 12 }, timer: { textAlign: "center", fontWeight: "800", marginVertical: 24 }, button: { borderRadius: 14, marginTop: 8 }, });

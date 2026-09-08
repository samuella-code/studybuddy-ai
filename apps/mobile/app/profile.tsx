import { router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Text, TextInput } from "react-native-paper";

import { updateProfile } from "../services/api";
import { useAuthStore } from "../store/auth";

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.accessToken);
  const setSession = useAuthStore((state) => state.setSession);
  const [name, setName] = useState(user?.name ?? "");
  const [level, setLevel] = useState(user?.learning_level ?? "beginner");
  const [goal, setGoal] = useState(String(user?.daily_goal_minutes ?? 60));
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!token) return;
    setSaving(true);
    try { const updated = await updateProfile({ name: name.trim(), learning_level: level, daily_goal_minutes: Number(goal) || 60 }, token); setSession(updated, token); Alert.alert("Profile saved", "Your learning preferences have been updated."); }
    catch (error) { Alert.alert("Could not save", error instanceof Error ? error.message : "Please try again."); }
    finally { setSaving(false); }
  }

  return <ScrollView contentContainerStyle={styles.container}><View style={styles.content}>
    <Button icon="arrow-left" onPress={() => router.back()} compact>Back</Button>
    <Text variant="headlineMedium" style={styles.title}>Your profile</Text>
    <Text style={styles.muted}>Help StudyBuddy tailor explanations and study goals to you.</Text>
    <Card style={styles.card}><Card.Content>
      <TextInput mode="outlined" label="Name" value={name} onChangeText={setName} style={styles.input} />
      <Text style={styles.label}>Learning level</Text>
      <View style={styles.row}>{["beginner", "intermediate", "advanced"].map((item) => <Button key={item} mode={level === item ? "contained" : "outlined"} onPress={() => setLevel(item)} compact>{item}</Button>)}</View>
      <TextInput mode="outlined" label="Daily study goal (minutes)" value={goal} onChangeText={setGoal} keyboardType="number-pad" style={styles.input} />
      <Button mode="contained" loading={saving} disabled={saving} onPress={() => void save()} style={styles.button}>Save profile</Button>
    </Card.Content></Card>
  </View></ScrollView>;
}
const styles = StyleSheet.create({ container: { padding: 20, paddingBottom: 48 }, content: { width: "100%", maxWidth: 700, alignSelf: "center", gap: 12 }, title: { fontWeight: "800", marginTop: 4 }, muted: { opacity: 0.68, lineHeight: 22 }, card: { borderRadius: 20, marginTop: 8 }, input: { marginBottom: 14 }, label: { fontWeight: "700", marginBottom: 8 }, row: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, button: { borderRadius: 14, marginTop: 20 }, });

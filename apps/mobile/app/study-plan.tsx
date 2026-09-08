import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Chip, Text, TextInput } from "react-native-paper";

import { createStudyPlan, getStudyPlans, type StudyPlan } from "../services/api";
import { useAuthStore } from "../store/auth";

export default function StudyPlanScreen() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [subject, setSubject] = useState("Computer Science");
  const [examDate, setExamDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 5); return d.toISOString().slice(0, 10); });
  const [minutes, setMinutes] = useState("60");
  const [confidence, setConfidence] = useState("medium");
  const [topics, setTopics] = useState("Data structures, Algorithms, Complexity");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (accessToken) void getStudyPlans(accessToken).then(setPlans).catch(() => undefined); }, [accessToken]);

  async function generate() {
    if (!accessToken || !subject.trim()) return;
    setLoading(true);
    try {
      const plan = await createStudyPlan({ subject: subject.trim(), exam_date: examDate, daily_minutes: Number(minutes) || 60, confidence, topics: topics.split(",").map((x) => x.trim()).filter(Boolean) }, accessToken);
      setPlans((current) => [plan, ...current]);
    } catch (error) { Alert.alert("Study plan unavailable", error instanceof Error ? error.message : "Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}><View style={styles.content}>
      <Button icon="arrow-left" onPress={() => router.back()} compact>Back</Button>
      <Text variant="headlineMedium" style={styles.title}>Your study plan 📅</Text>
      <Text style={styles.subtitle}>Tell StudyBuddy when your exam is and how much time you have. It will build a practical plan.</Text>
      <Card style={styles.form}><Card.Content>
        <TextInput mode="outlined" label="Subject" value={subject} onChangeText={setSubject} style={styles.input} />
        <TextInput mode="outlined" label="Exam date (YYYY-MM-DD)" value={examDate} onChangeText={setExamDate} style={styles.input} />
        <TextInput mode="outlined" label="Daily study minutes" value={minutes} onChangeText={setMinutes} keyboardType="number-pad" style={styles.input} />
        <TextInput mode="outlined" label="Topics (comma separated)" value={topics} onChangeText={setTopics} multiline style={styles.input} />
        <Text style={styles.label}>Confidence</Text>
        <View style={styles.chips}>{["low", "medium", "high"].map((value) => <Chip key={value} selected={confidence === value} onPress={() => setConfidence(value)}>{value}</Chip>)}</View>
        <Button mode="contained" loading={loading} disabled={loading || !accessToken} onPress={() => void generate()} style={styles.button}>Generate my plan</Button>
      </Card.Content></Card>

      {plans.map((plan) => <Card key={plan.id} style={styles.summary}><Card.Content>
        <Text variant="titleMedium" style={styles.bold}>{plan.subject}</Text><Text style={styles.muted}>Exam: {plan.exam_date} · {plan.daily_minutes} min/day</Text>
        <View style={styles.chips}><Chip icon="target">{plan.confidence} confidence</Chip><Chip icon="calendar">{plan.plan.length} sessions</Chip></View>
        {plan.plan.slice(0, 7).map((item, index) => <View key={`${plan.id}-${index}`} style={styles.session}><Text variant="labelLarge">{String(item.date ?? `Session ${index + 1}`)}</Text><Text style={styles.bold}>{String(item.topic ?? "Review")}</Text><Text style={styles.muted}>{String(item.activity ?? "Focused study and active recall")}</Text></View>)}
      </Card.Content></Card>)}
    </View></ScrollView>
  );
}

const styles = StyleSheet.create({ container: { padding: 20, paddingBottom: 48 }, content: { width: "100%", maxWidth: 820, alignSelf: "center", gap: 12 }, title: { fontWeight: "800", marginTop: 4 }, subtitle: { opacity: 0.68, lineHeight: 22, marginBottom: 8 }, form: { borderRadius: 20 }, input: { marginBottom: 10 }, label: { marginTop: 8, fontWeight: "700" }, summary: { borderRadius: 18 }, bold: { fontWeight: "800" }, muted: { opacity: 0.68, marginTop: 4 }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }, button: { borderRadius: 14, marginTop: 16 }, session: { borderTopWidth: 1, borderTopColor: "rgba(128,128,128,0.2)", paddingTop: 12, marginTop: 12 }, });

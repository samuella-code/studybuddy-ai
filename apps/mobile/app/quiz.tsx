import { router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, RadioButton, Text, TextInput } from "react-native-paper";

import { generateQuiz, submitQuiz, type Quiz } from "../services/api";
import { useAuthStore } from "../store/auth";

export default function QuizScreen() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [subject, setSubject] = useState("Biology");
  const [topic, setTopic] = useState("");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; total: number; percentage: number; feedback: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  async function startQuiz() {
    if (!accessToken || !subject.trim()) return;
    setLoading(true);
    try { setQuiz(await generateQuiz({ subject: subject.trim(), topic: topic.trim() || undefined, difficulty: "medium", count: 5 }, accessToken)); setIndex(0); setAnswers({}); setResult(null); setSelected(""); }
    catch (error) { Alert.alert("Quiz unavailable", error instanceof Error ? error.message : "Please try again."); }
    finally { setLoading(false); }
  }

  async function next() {
    if (!quiz || !selected || !accessToken) return;
    const nextAnswers = { ...answers, [quiz.questions[index].id]: selected };
    setAnswers(nextAnswers);
    if (index < quiz.questions.length - 1) { setIndex(index + 1); setSelected(""); return; }
    setLoading(true);
    try { setResult(await submitQuiz(quiz.id, nextAnswers, accessToken)); }
    catch (error) { Alert.alert("Could not submit quiz", error instanceof Error ? error.message : "Please try again."); }
    finally { setLoading(false); }
  }

  if (result) return (
    <View style={styles.center}>
      <Card style={styles.result}><Card.Content>
        <Text variant="headlineMedium" style={styles.bold}>Quiz complete 🎉</Text>
        <Text variant="displaySmall" style={styles.score}>{result.score}/{result.total}</Text>
        <Text style={styles.muted}>You scored {result.percentage}%. {result.percentage >= 80 ? "Excellent work!" : "Keep practising and review the explanations below."}</Text>
        {result.feedback.slice(0, 3).map((item) => <Text key={item} style={styles.feedback}>{item}</Text>)}
        <Button mode="contained" onPress={() => { setQuiz(null); setResult(null); }} style={styles.button}>New quiz</Button>
        <Button onPress={() => router.replace("/home")}>Back to dashboard</Button>
      </Card.Content></Card>
    </View>
  );

  if (!quiz) return (
    <ScrollView contentContainerStyle={styles.container}><View style={styles.content}>
      <Button icon="arrow-left" onPress={() => router.back()} compact>Back</Button>
      <Text variant="headlineMedium" style={styles.title}>Quiz me 🧠</Text>
      <Text style={styles.muted}>StudyBuddy will generate questions and explain what you miss.</Text>
      <TextInput mode="outlined" label="Subject" value={subject} onChangeText={setSubject} style={styles.input} />
      <TextInput mode="outlined" label="Topic (optional)" value={topic} onChangeText={setTopic} placeholder="e.g. Cell biology" style={styles.input} />
      <Button mode="contained" loading={loading} disabled={loading || !subject.trim() || !accessToken} onPress={() => void startQuiz()} style={styles.button}>Generate quiz</Button>
    </View></ScrollView>
  );

  const current = quiz.questions[index];
  return (
    <ScrollView contentContainerStyle={styles.container}><View style={styles.content}>
      <Button icon="arrow-left" onPress={() => router.back()} compact>Exit</Button>
      <Text variant="headlineMedium" style={styles.title}>{quiz.subject} quiz</Text>
      <Text style={styles.muted}>Question {index + 1} of {quiz.questions.length}</Text>
      <Card style={styles.card}><Card.Content>
        <Text variant="titleLarge" style={styles.question}>{current.question}</Text>
        <RadioButton.Group onValueChange={setSelected} value={selected}>{current.options.map((option) => <View key={option} style={styles.option}><RadioButton value={option} /><Text style={styles.optionText}>{option}</Text></View>)}</RadioButton.Group>
      </Card.Content></Card>
      <Button mode="contained" loading={loading} disabled={!selected || loading} onPress={() => void next()} style={styles.button}>{index === quiz.questions.length - 1 ? "Finish quiz" : "Next question"}</Button>
    </View></ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 }, content: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 12 }, title: { fontWeight: "800", marginTop: 4 }, muted: { opacity: 0.68, lineHeight: 22 }, input: { marginTop: 6 }, card: { borderRadius: 20, marginTop: 10 }, question: { fontWeight: "700", lineHeight: 28, marginBottom: 12 }, option: { flexDirection: "row", alignItems: "center", minHeight: 52 }, optionText: { fontSize: 16 }, button: { borderRadius: 14, marginTop: 8 }, center: { flex: 1, justifyContent: "center", padding: 20 }, result: { width: "100%", maxWidth: 560, alignSelf: "center", borderRadius: 22 }, bold: { fontWeight: "800" }, score: { fontWeight: "800", marginTop: 18 }, feedback: { marginTop: 12, lineHeight: 20 },
});

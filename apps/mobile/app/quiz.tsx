import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, RadioButton, Text } from "react-native-paper";

const QUESTIONS = [
  { question: "What is the derivative of x²?", options: ["x", "2x", "x²", "2"], answer: "2x" },
  { question: "Which structure follows LIFO?", options: ["Queue", "Array", "Stack", "Graph"], answer: "Stack" },
  { question: "What organelle is known as the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondrion", "Golgi body"], answer: "Mitochondrion" },
];

export default function QuizScreen() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const current = QUESTIONS[index];

  function next() {
    const nextScore = score + (selected === current.answer ? 1 : 0);
    if (index === QUESTIONS.length - 1) {
      setScore(nextScore);
      setDone(true);
      return;
    }
    setScore(nextScore);
    setSelected("");
    setIndex(index + 1);
  }

  if (done) {
    return (
      <View style={styles.center}>
        <Card style={styles.result}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.bold}>Quiz complete 🎉</Text>
            <Text variant="titleLarge" style={styles.score}>{score}/{QUESTIONS.length}</Text>
            <Text style={styles.muted}>Keep practising — consistency beats cramming.</Text>
            <Button mode="contained" onPress={() => router.replace("/home")} style={styles.button}>Back to dashboard</Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Button icon="arrow-left" onPress={() => router.back()} compact>Back</Button>
        <Text variant="headlineMedium" style={styles.title}>Quick quiz</Text>
        <Text style={styles.muted}>Question {index + 1} of {QUESTIONS.length}</Text>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.question}>{current.question}</Text>
            <RadioButton.Group onValueChange={setSelected} value={selected}>
              {current.options.map((option) => (
                <View key={option} style={styles.option}>
                  <RadioButton value={option} />
                  <Text style={styles.optionText}>{option}</Text>
                </View>
              ))}
            </RadioButton.Group>
          </Card.Content>
        </Card>
        <Button mode="contained" disabled={!selected} onPress={next} style={styles.button}>
          {index === QUESTIONS.length - 1 ? "Finish quiz" : "Next question"}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  content: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 12 },
  title: { fontWeight: "800", marginTop: 4 },
  muted: { opacity: 0.68 },
  card: { borderRadius: 20, marginTop: 10 },
  question: { fontWeight: "700", lineHeight: 28, marginBottom: 12 },
  option: { flexDirection: "row", alignItems: "center", minHeight: 52 },
  optionText: { fontSize: 16 },
  button: { borderRadius: 14, marginTop: 8 },
  center: { flex: 1, justifyContent: "center", padding: 20 },
  result: { width: "100%", maxWidth: 520, alignSelf: "center", borderRadius: 22 },
  bold: { fontWeight: "800" },
  score: { fontWeight: "800", marginTop: 18 },
});

import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, Card, Chip, Text } from "react-native-paper";

const CARDS = [
  { subject: "Computer Science", front: "What does FIFO mean?", back: "First In, First Out — the principle used by a queue." },
  { subject: "Biology", front: "What is photosynthesis?", back: "The process plants use to convert light energy into chemical energy." },
  { subject: "Mathematics", front: "What is the quadratic formula?", back: "x = (-b ± √(b² - 4ac)) / 2a" },
];

export default function FlashcardsScreen() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = CARDS[index];

  function next() {
    setIndex((value) => (value + 1) % CARDS.length);
    setFlipped(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Button icon="arrow-left" onPress={() => router.back()} compact>Back</Button>
        <Text variant="headlineMedium" style={styles.title}>Flashcards</Text>
        <Text style={styles.muted}>Card {index + 1} of {CARDS.length}</Text>
        <Pressable onPress={() => setFlipped((value) => !value)}>
          <Card style={styles.card} mode="contained">
            <Card.Content style={styles.cardContent}>
              <Chip icon="book-open-variant">{card.subject}</Chip>
              <Text variant="headlineSmall" style={styles.cardText}>{flipped ? card.back : card.front}</Text>
              <Text style={styles.hint}>{flipped ? "Tap to see the question" : "Tap to reveal the answer"}</Text>
            </Card.Content>
          </Card>
        </Pressable>
        <Button mode="contained" onPress={next} style={styles.button}>Next card</Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  content: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 12, marginTop: 8 },
  title: { fontWeight: "800", marginTop: 4 },
  muted: { opacity: 0.68 },
  card: { borderRadius: 24, minHeight: 330, justifyContent: "center", marginTop: 12 },
  cardContent: { flex: 1, justifyContent: "center", alignItems: "center", padding: 28 },
  cardText: { fontWeight: "700", textAlign: "center", lineHeight: 32, marginTop: 30 },
  hint: { opacity: 0.55, marginTop: 28 },
  button: { borderRadius: 14, marginTop: 8 },
});

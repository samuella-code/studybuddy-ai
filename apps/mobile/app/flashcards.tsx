import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { Button, Card, Chip, Text, TextInput } from "react-native-paper";

import { generateFlashcards, getFlashcards, type Flashcard } from "../services/api";
import { useAuthStore } from "../store/auth";

export default function FlashcardsScreen() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [subject, setSubject] = useState("Biology");
  const [topic, setTopic] = useState("Cell biology");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (accessToken) void getFlashcards(accessToken).then(setCards).catch(() => undefined); }, [accessToken]);

  async function generate() {
    if (!accessToken || !subject.trim() || !topic.trim()) return;
    setLoading(true);
    try { const generated = await generateFlashcards({ subject: subject.trim(), topic: topic.trim(), count: 10 }, accessToken); setCards(generated); setIndex(0); setFlipped(false); }
    catch (error) { Alert.alert("Flashcards unavailable", error instanceof Error ? error.message : "Please try again."); }
    finally { setLoading(false); }
  }

  if (!cards.length) return (
    <View style={styles.container}><View style={styles.content}>
      <Button icon="arrow-left" onPress={() => router.back()} compact>Back</Button>
      <Text variant="headlineMedium" style={styles.title}>Flashcards 🗂</Text>
      <Text style={styles.muted}>Generate a set of cards from any subject or topic.</Text>
      <TextInput mode="outlined" label="Subject" value={subject} onChangeText={setSubject} style={styles.input} />
      <TextInput mode="outlined" label="Topic" value={topic} onChangeText={setTopic} style={styles.input} />
      <Button mode="contained" loading={loading} disabled={loading || !accessToken} onPress={() => void generate()} style={styles.button}>Create flashcards</Button>
    </View></View>
  );

  const card = cards[index];
  return (
    <View style={styles.container}><View style={styles.content}>
      <Button icon="arrow-left" onPress={() => router.back()} compact>Back</Button>
      <View style={styles.headerRow}><View><Text variant="headlineMedium" style={styles.title}>Flashcards</Text><Text style={styles.muted}>Card {index + 1} of {cards.length}</Text></View><Button onPress={() => void generate()} compact loading={loading}>New set</Button></View>
      <Pressable onPress={() => setFlipped((value) => !value)} accessibilityRole="button">
        <Card style={styles.card} mode="contained"><Card.Content style={styles.cardContent}>
          <Chip icon="book-open-variant">{card.subject}</Chip>
          <Text variant="headlineSmall" style={styles.cardText}>{flipped ? card.answer : card.question}</Text>
          <Text style={styles.hint}>{flipped ? "Tap to see the question" : "Tap to reveal the answer"}</Text>
        </Card.Content></Card>
      </Pressable>
      <Button mode="contained" onPress={() => { setIndex((value) => (value + 1) % cards.length); setFlipped(false); }} style={styles.button}>Next card</Button>
    </View></View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 }, content: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 12, marginTop: 8 }, title: { fontWeight: "800", marginTop: 4 }, muted: { opacity: 0.68 }, input: { marginTop: 6 }, headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, card: { borderRadius: 24, minHeight: 330, justifyContent: "center", marginTop: 12 }, cardContent: { flex: 1, justifyContent: "center", alignItems: "center", padding: 28 }, cardText: { fontWeight: "700", textAlign: "center", lineHeight: 32, marginTop: 30 }, hint: { opacity: 0.55, marginTop: 28 }, button: { borderRadius: 14, marginTop: 8 },
});

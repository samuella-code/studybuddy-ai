import { useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Text, TextInput } from "react-native-paper";
import { sendChatMessage } from "../services/api";
import { useAuthStore } from "../store/auth";

type Message = { role: "user" | "assistant"; content: string };

export default function TutorScreen() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const canSend = useMemo(() => Boolean(input.trim() && accessToken && !loading), [input, accessToken, loading]);

  async function handleSend() {
    const message = input.trim();
    if (!message || !accessToken || loading) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: message }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const result = await sendChatMessage(message, accessToken, messages);
      setMessages([...nextMessages, { role: "assistant", content: result.message }]);
    } catch (error) {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: error instanceof Error ? error.message : "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>StudyBuddy Tutor</Text>
        <Text style={styles.subtitle}>Ask questions and learn step by step.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled">
        {messages.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="titleMedium">What are you studying today?</Text>
              <Text style={styles.muted}>Try asking StudyBuddy to explain a concept, give an example, or quiz you.</Text>
            </Card.Content>
          </Card>
        ) : (
          messages.map((message, index) => (
            <Card key={`${message.role}-${index}`} style={[styles.messageCard, message.role === "user" && styles.userCard]}>
              <Card.Content>
                <Text variant="labelMedium">{message.role === "user" ? "You" : "StudyBuddy"}</Text>
                <Text style={styles.messageText}>{message.content}</Text>
              </Card.Content>
            </Card>
          ))
        )}
        {loading && <ActivityIndicator style={styles.loader} />}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          mode="outlined"
          value={input}
          onChangeText={setInput}
          placeholder="Ask StudyBuddy anything..."
          multiline
          style={styles.input}
          disabled={!accessToken || loading}
        />
        <Button mode="contained" onPress={handleSend} disabled={!canSend} style={styles.send}>
          Send
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { paddingTop: 18, paddingBottom: 16 },
  title: { fontWeight: "800" },
  subtitle: { opacity: 0.7, marginTop: 4 },
  messages: { gap: 12, paddingBottom: 16, flexGrow: 1 },
  emptyCard: { marginTop: 20 },
  messageCard: { borderRadius: 16 },
  userCard: { alignSelf: "flex-end", width: "90%" },
  messageText: { marginTop: 6, lineHeight: 22 },
  muted: { marginTop: 8, opacity: 0.7, lineHeight: 21 },
  loader: { marginVertical: 10 },
  composer: { gap: 10, paddingTop: 10, paddingBottom: 8 },
  input: { maxHeight: 120 },
  send: { borderRadius: 12 },
});

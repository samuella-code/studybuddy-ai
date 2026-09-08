import { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import * as Speech from "expo-speech";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { Button, Card, IconButton, Text, TextInput } from "react-native-paper";
import { sendChatMessage } from "../services/api";
import { useAuthStore } from "../store/auth";

type Message = { role: "user" | "assistant"; content: string };
type TutorState = "idle" | "listening" | "processing" | "speaking";

const OFFLINE_TOKEN = "offline-demo";

function offlineTutorReply(message: string, history: Message[]): string {
  const prompt = message.toLowerCase().trim();
  const topic = prompt.match(/(?:explain|teach me|help me understand|what is)\s+(?:an?\s+)?(.+)/)?.[1]?.replace(/[?.!]+$/, "") || "this topic";

  if (prompt.includes("quiz") || prompt.includes("test me") || prompt.includes("question me")) {
    return "Absolutely — quiz mode is on.\n\nQuestion 1: What is the powerhouse of the cell?\n\nA) Nucleus\nB) Mitochondrion\nC) Ribosome\nD) Cell membrane\n\nSay or type A, B, C, or D. I'll check your answer and explain it before giving you the next question.";
  }
  if (prompt.includes("flashcard")) {
    return "Let's make a flashcard.\n\nFront: What is the main idea of the topic you're studying?\nBack: State the definition in one clear sentence, then add one example.\n\nTell me the topic and I'll help you build a useful set of flashcards offline.";
  }
  if (prompt.includes("simpl") || prompt.includes("beginner") || prompt.includes("don't understand") || prompt.includes("dont understand")) {
    return `Let's make ${topic} much simpler. Think of it as something you can explain to a friend in one sentence.\n\nFirst, remember the basic idea. Then connect it to a familiar example. Finally, try explaining it back to me in your own words.\n\nIf you tell me the exact concept you mean, I'll break it down step by step.`;
  }
  if (prompt.includes("example")) {
    return `Here's a simple way to learn it: start with one real-life example, identify what changes, and then connect that example back to the definition.\n\nFor ${topic}, tell me the exact concept you're working on and I'll give you a concrete example you can remember.`;
  }
  if (prompt.includes("summary") || prompt.includes("summarize")) {
    return history.length
      ? "StudyBuddy recap: focus on the key definition, one example, and one thing you can explain without your notes. Now tell me the part you still find confusing and we'll work through it."
      : "Your study summary starts with three things: the main definition, a practical example, and a quick self-test. Tell me the topic and I'll turn it into a short revision guide.";
  }
  if (prompt.includes("array")) {
    return "An array is an ordered collection of values stored together. Think of it like a row of labelled lockers: each position has a number, and that number lets you find what is inside.\n\nExample: [10, 20, 30] has 10 at index 0, 20 at index 1, and 30 at index 2.\n\nWant me to explain arrays more simply, show code, or quiz you?";
  }
  if (prompt.includes("photosynthesis")) {
    return "Photosynthesis is how green plants use light energy to make food.\n\nThe simple version is: sunlight + water + carbon dioxide → glucose + oxygen.\n\nThink of the leaf as a tiny food factory. Sunlight provides the energy, water and carbon dioxide are the raw materials, and glucose is the food produced.";
  }
  if (prompt.includes("algebra")) {
    return "Algebra is about finding unknown values and describing relationships with symbols.\n\nFor example, in x + 3 = 7, x is the unknown. Subtract 3 from both sides, so x = 4.\n\nThe key idea is to keep both sides of the equation balanced.";
  }
  if (prompt.includes("hello") || prompt.includes("hi") || prompt.includes("hey")) {
    return "Hey! I'm StudyBuddy. Tell me what you're studying, and we'll work through it together. You can ask me to explain something, simplify it, give an example, or quiz you.";
  }
  return `Let's work on ${topic}. Start by telling me what you already know, even if you're not sure it's correct. I'll help you build the idea step by step.\n\nYou can also say “make it simpler”, “give me an example”, “summarize this”, or “quiz me”.`;
}

export default function TutorScreen() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [state, setState] = useState<TutorState>("idle");
  const [transcript, setTranscript] = useState("");
  const [offline, setOffline] = useState(false);

  const canSend = useMemo(() => Boolean(input.trim() && accessToken && state !== "processing" && state !== "speaking"), [input, accessToken, state]);

  useSpeechRecognitionEvent("start", () => {
    setState("listening");
    setTranscript("");
  });

  useSpeechRecognitionEvent("result", (event) => {
    const text = event.results[0]?.transcript ?? "";
    setTranscript(text);
    if (event.isFinal && text.trim()) {
      setInput(text.trim());
      void handleSend(text.trim());
    }
  });

  useSpeechRecognitionEvent("end", () => {
    setState((current) => current === "listening" ? "idle" : current);
  });

  useSpeechRecognitionEvent("error", (event) => {
    setState("idle");
    if (event.error === "aborted") return;
    if (event.error === "network") {
      Alert.alert("Voice recognition needs a connection", "Your device could not use its installed offline speech model. On Android, install the offline English speech model in the device speech settings and try again.");
      return;
    }
    Alert.alert("Voice input", event.message || "I couldn't hear that. Please try again.");
  });

  useEffect(() => () => { Speech.stop(); ExpoSpeechRecognitionModule.abort(); }, []);

  async function handleSend(text = input) {
    const message = text.trim();
    if (!message || !accessToken || state === "processing") return;

    const nextMessages: Message[] = [...messages, { role: "user", content: message }];
    setMessages(nextMessages);
    setInput("");
    setTranscript("");
    setState("processing");

    try {
      const result = offline || accessToken === OFFLINE_TOKEN
        ? { message: offlineTutorReply(message, messages) }
        : await sendChatMessage(message, accessToken, messages);
      setOffline(offline || accessToken === OFFLINE_TOKEN);
      const answer = result.message;
      setMessages([...nextMessages, { role: "assistant", content: answer }]);
      speak(answer);
    } catch {
      setOffline(true);
      const answer = offlineTutorReply(message, messages);
      setMessages([...nextMessages, { role: "assistant", content: answer }]);
      speak(answer);
    }
  }

  async function startListening() {
    if (!accessToken || state === "processing" || state === "speaking") return;
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Microphone permission needed", "Allow StudyBuddy to use your microphone so you can talk to your tutor.");
        return;
      }

      setTranscript("");
      setState("listening");
      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
        requiresOnDeviceRecognition: Platform.OS !== "web",
        addsPunctuation: true,
      });
    } catch (error) {
      setState("idle");
      Alert.alert("Voice input", error instanceof Error ? error.message : "I couldn't start the microphone.");
    }
  }

  function stopListening() {
    ExpoSpeechRecognitionModule.stop();
    setState("idle");
  }

  function speak(text: string) {
    Speech.stop();
    setState("speaking");
    Speech.speak(text, {
      rate: 0.92,
      pitch: 1,
      onDone: () => setState("idle"),
      onStopped: () => setState("idle"),
      onError: () => setState("idle"),
    });
  }

  function stopSpeaking() {
    Speech.stop();
    setState("idle");
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text variant="headlineSmall" style={styles.title}>StudyBuddy</Text>
            <Text style={styles.subtitle}>Your personal tutor. Ask, listen, learn.</Text>
          </View>
          <View style={styles.modePill}>
            <View style={[styles.modeDot, offline ? styles.offlineDot : styles.onlineDot]} />
            <Text style={styles.modeText}>{offline ? "Offline study" : "Online"}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled">
        {messages.length === 0 ? (
          <View style={styles.welcome}>
            <View style={styles.welcomeBadge}><Text style={styles.welcomeBadgeText}>SB</Text></View>
            <Text variant="headlineSmall" style={styles.welcomeTitle}>What are you studying?</Text>
            <Text style={styles.welcomeText}>Talk to me naturally. Ask me to explain a concept, make it simpler, give an example, or quiz you.</Text>
          </View>
        ) : messages.map((message, index) => (
          <Card key={`${message.role}-${index}`} style={[styles.messageCard, message.role === "user" ? styles.userCard : styles.assistantCard]} mode="elevated">
            <Card.Content>
              <View style={styles.messageHeader}>
                <Text style={message.role === "user" ? styles.userLabel : styles.assistantLabel}>{message.role === "user" ? "You" : "StudyBuddy"}</Text>
                {message.role === "assistant" && <IconButton icon="volume-high" size={20} onPress={() => speak(message.content)} accessibilityLabel="Read answer aloud" />}
              </View>
              <Text style={styles.messageText}>{message.content}</Text>
            </Card.Content>
          </Card>
        ))}
        {state === "processing" && <View style={styles.thinking}><View style={styles.thinkingDot} /><Text style={styles.thinkingText}>StudyBuddy is thinking…</Text></View>}
      </ScrollView>

      <View style={styles.voiceArea}>
        <View style={[styles.voiceGlow, state === "listening" && styles.listeningGlow]}>
          <IconButton
            icon={state === "listening" ? "stop" : state === "speaking" ? "volume-high" : "microphone"}
            mode="contained"
            size={42}
            onPress={state === "listening" ? stopListening : state === "speaking" ? stopSpeaking : startListening}
            disabled={state === "processing"}
            accessibilityLabel={state === "listening" ? "Stop listening" : state === "speaking" ? "Stop speaking" : "Tap to talk"}
          />
        </View>
        <Text style={styles.voiceLabel}>{state === "listening" ? "Listening…" : state === "processing" ? "Thinking…" : state === "speaking" ? "StudyBuddy is speaking…" : "Tap to talk"}</Text>
        {state === "listening" && transcript ? <Text style={styles.transcript}>“{transcript}”</Text> : null}
      </View>

      <View style={styles.composer}>
        <TextInput mode="outlined" value={input} onChangeText={setInput} placeholder="Or type your question…" placeholderTextColor="#64736E" multiline style={styles.input} disabled={!accessToken || state === "processing" || state === "speaking"} />
        <Button mode="contained" onPress={() => void handleSend()} disabled={!canSend} style={styles.send} contentStyle={styles.sendContent}>Send</Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, backgroundColor: "#F4F7F5" },
  header: { paddingTop: 18, paddingBottom: 14 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  headerCopy: { flex: 1 },
  title: { color: "#10231E", fontWeight: "800", letterSpacing: -0.4 },
  subtitle: { color: "#42524D", marginTop: 5, lineHeight: 21, fontSize: 14 },
  modePill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D8E2DE" },
  modeDot: { width: 7, height: 7, borderRadius: 4 },
  onlineDot: { backgroundColor: "#137565" },
  offlineDot: { backgroundColor: "#B05A4E" },
  modeText: { color: "#263A34", fontSize: 12, fontWeight: "700" },
  messages: { gap: 12, paddingBottom: 8, flexGrow: 1 },
  welcome: { alignItems: "center", paddingTop: 42, paddingHorizontal: 18 },
  welcomeBadge: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", backgroundColor: "#D8EEE8", marginBottom: 18 },
  welcomeBadgeText: { color: "#126C5D", fontWeight: "900", fontSize: 18 },
  welcomeTitle: { color: "#10231E", fontWeight: "800", textAlign: "center" },
  welcomeText: { color: "#4A5B55", lineHeight: 23, fontSize: 15, textAlign: "center", marginTop: 9 },
  messageCard: { borderRadius: 18 },
  assistantCard: { backgroundColor: "#FFFFFF" },
  userCard: { alignSelf: "flex-end", width: "90%", backgroundColor: "#DCEFEA" },
  messageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  userLabel: { color: "#116B5C", fontWeight: "800" },
  assistantLabel: { color: "#A34D42", fontWeight: "800" },
  messageText: { marginTop: 2, lineHeight: 24, fontSize: 16, color: "#172621" },
  thinking: { flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 4, paddingVertical: 10 },
  thinkingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#A34D42" },
  thinkingText: { color: "#44564F", fontWeight: "600" },
  voiceArea: { alignItems: "center", paddingVertical: 8 },
  voiceGlow: { width: 92, height: 92, borderRadius: 46, alignItems: "center", justifyContent: "center", backgroundColor: "#DCEFEA", borderWidth: 1, borderColor: "#B8DCD2" },
  listeningGlow: { backgroundColor: "#F8E5E1", borderColor: "#E3B7AF", transform: [{ scale: 1.06 }] },
  voiceLabel: { marginTop: 7, color: "#263B34", fontWeight: "800", fontSize: 14 },
  transcript: { maxWidth: "90%", color: "#4A5B55", fontSize: 13, marginTop: 5, textAlign: "center" },
  composer: { gap: 9, paddingTop: 8, paddingBottom: 5 },
  input: { maxHeight: 110, backgroundColor: "#FFFFFF", color: "#172621" },
  send: { borderRadius: 14 },
  sendContent: { paddingVertical: 4 },
});

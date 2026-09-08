import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import * as Speech from "expo-speech";
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { Button, Card, IconButton, Text, TextInput } from "react-native-paper";
import { sendChatMessage, transcribeVoice } from "../services/api";
import { useAuthStore } from "../store/auth";

type Message = { role: "user" | "assistant"; content: string };
type TutorState = "idle" | "listening" | "processing" | "speaking";

const OFFLINE_TOKEN = "offline-demo";

function offlineTutorReply(message: string): string {
  const prompt = message.toLowerCase();
  if (prompt.includes("quiz") || prompt.includes("test me")) {
    return "Absolutely. Offline quiz mode is ready.\n\nQuestion 1: What is the powerhouse of the cell?\n\nA) Nucleus\nB) Mitochondrion\nC) Ribosome\nD) Cell membrane\n\nReply with A, B, C, or D and I'll check your answer.";
  }
  if (prompt.includes("array")) {
    return "An array is a collection of values stored together in an ordered list.\n\nThink of it like a row of labelled lockers: each locker has a position, and you can use that position to find what is inside.\n\nExample: [10, 20, 30] has 10 at index 0, 20 at index 1, and 30 at index 2.\n\nIf you'd like, ask me for an example, a simpler explanation, or a quick quiz.";
  }
  if (prompt.includes("photosynthesis")) {
    return "Photosynthesis is the process plants use to make food from light energy.\n\nIn simple terms: plants take in carbon dioxide and water, use sunlight as energy, and produce glucose and oxygen.\n\nA useful memory trick is: light + water + carbon dioxide → food + oxygen.";
  }
  if (prompt.includes("summarize") || prompt.includes("summary")) {
    return "Here is a simple study summary: focus on the main definition, understand one real example, then test yourself without looking at your notes. This offline tutor can keep helping you practise even when the server is unavailable.";
  }
  return "I'm in offline study mode right now, so I can still help you practise. Try asking me about arrays, photosynthesis, a concept you want simplified, an example, or say “quiz me”. When you're back online, StudyBuddy will use the full AI tutor and your saved learning data.";
}

export default function TutorScreen() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [state, setState] = useState<TutorState>("idle");
  const [microphoneReady, setMicrophoneReady] = useState(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const offlineMode = accessToken === OFFLINE_TOKEN;

  useEffect(() => {
    void (async () => {
      try {
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        if (permission.granted) {
          await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
          setMicrophoneReady(true);
        }
      } catch {
        setMicrophoneReady(false);
      }
    })();
    return () => { Speech.stop(); };
  }, []);

  const canSend = useMemo(
    () => Boolean(input.trim() && accessToken && state !== "processing" && state !== "speaking"),
    [input, accessToken, state],
  );

  async function handleSend(text = input) {
    const message = text.trim();
    if (!message || !accessToken || state === "processing") return;
    const nextMessages = [...messages, { role: "user" as const, content: message }];
    setMessages(nextMessages);
    setInput("");
    setState("processing");

    try {
      const result = offlineMode
        ? { message: offlineTutorReply(message) }
        : await sendChatMessage(message, accessToken, messages);
      setMessages([...nextMessages, { role: "assistant", content: result.message }]);
      speak(result.message);
    } catch {
      const fallback = offlineTutorReply(message);
      setMessages([...nextMessages, { role: "assistant", content: fallback }]);
      setState("idle");
    }
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

  async function startRecording() {
    if (!accessToken || state === "processing" || state === "speaking") return;
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Microphone permission needed", "Allow StudyBuddy to use your microphone so you can talk to your tutor.");
      return;
    }
    try {
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setMicrophoneReady(true);
      setState("listening");
    } catch {
      setState("idle");
      Alert.alert("Could not start recording", "Please check your microphone and try again.");
    }
  }

  async function stopRecording() {
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri || !accessToken) {
        setState("idle");
        return;
      }
      setState("processing");
      if (offlineMode) {
        setMessages((current) => [
          ...current,
          { role: "assistant", content: "Your voice recording was captured. Offline mode can't transcribe audio without a speech model, but you can type the question below and I'll keep helping you." },
        ]);
        setState("idle");
        return;
      }
      const result = await transcribeVoice(
        { uri, name: Platform.OS === "web" ? "recording.webm" : "recording.m4a", type: Platform.OS === "web" ? "audio/webm" : "audio/m4a" },
        accessToken,
      );
      if (!result.text.trim()) throw new Error("No speech was detected. Please try again.");
      await handleSend(result.text);
    } catch (error) {
      setState("idle");
      Alert.alert("Voice input failed", error instanceof Error ? error.message : "Please try again.");
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text variant="headlineSmall" style={styles.title}>StudyBuddy Tutor</Text>
            <Text style={styles.subtitle}>Talk naturally, ask follow-ups, and learn step by step.</Text>
          </View>
          <View style={styles.modePill}>
            <View style={[styles.modeDot, offlineMode ? styles.offlineDot : styles.onlineDot]} />
            <Text style={styles.modeText}>{offlineMode ? "Offline" : "Online"}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled">
        {messages.length === 0 ? (
          <Card style={styles.emptyCard} mode="elevated">
            <Card.Content>
              <Text variant="titleLarge" style={styles.cardTitle}>What are you studying today?</Text>
              <Text style={styles.muted}>Try “Explain arrays”, “Give me an example”, “Make it simpler”, or “Quiz me”.</Text>
            </Card.Content>
          </Card>
        ) : messages.map((message, index) => (
          <Card key={`${message.role}-${index}`} style={[styles.messageCard, message.role === "user" ? styles.userCard : styles.assistantCard]} mode="elevated">
            <Card.Content>
              <View style={styles.messageHeader}>
                <Text variant="labelLarge" style={message.role === "user" ? styles.userLabel : styles.assistantLabel}>
                  {message.role === "user" ? "You" : "StudyBuddy"}
                </Text>
                {message.role === "assistant" && <IconButton icon="volume-high" size={19} onPress={() => speak(message.content)} accessibilityLabel="Read answer aloud" />}
              </View>
              <Text style={styles.messageText}>{message.content}</Text>
            </Card.Content>
          </Card>
        ))}
        {state === "processing" && (
          <View style={styles.thinkingRow}>
            <ActivityIndicator size="small" />
            <Text style={styles.thinkingText}>StudyBuddy is thinking…</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.voiceArea}>
        <View style={[styles.voiceRing, state === "listening" && styles.listeningRing]}>
          <IconButton
            icon={state === "listening" ? "stop" : state === "speaking" ? "volume-high" : "microphone"}
            mode="contained"
            size={38}
            onPress={state === "listening" ? stopRecording : state === "speaking" ? stopSpeaking : startRecording}
            disabled={state === "processing"}
            accessibilityLabel={state === "listening" ? "Stop listening" : state === "speaking" ? "Stop speaking" : "Tap to talk"}
          />
        </View>
        <Text style={styles.voiceLabel}>
          {state === "listening" ? "Listening…" : state === "processing" ? "Thinking…" : state === "speaking" ? "StudyBuddy is speaking…" : microphoneReady ? "Tap to talk" : "Tap to allow microphone"}
        </Text>
      </View>

      <View style={styles.composer}>
        <TextInput mode="outlined" value={input} onChangeText={setInput} placeholder="Ask StudyBuddy anything…" placeholderTextColor="#6B7672" multiline style={styles.input} disabled={!accessToken || state === "processing" || state === "speaking"} />
        <Button mode="contained" onPress={() => void handleSend()} disabled={!canSend} style={styles.send} contentStyle={styles.sendContent}>Send</Button>
      </View>
      {recorderState.isRecording ? <Text style={styles.recordingHint}>Recording in progress · tap stop when you're finished.</Text> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F6F8F7" },
  header: { paddingTop: 18, paddingBottom: 14 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  headerCopy: { flex: 1 },
  title: { color: "#10201C", fontWeight: "800" },
  subtitle: { color: "#354641", marginTop: 5, lineHeight: 22, fontSize: 14 },
  modePill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DCE5E1" },
  modeDot: { width: 7, height: 7, borderRadius: 4 },
  onlineDot: { backgroundColor: "#136F63" },
  offlineDot: { backgroundColor: "#A44A3F" },
  modeText: { color: "#273733", fontSize: 12, fontWeight: "700" },
  messages: { gap: 12, paddingBottom: 10, flexGrow: 1 },
  emptyCard: { marginTop: 20, borderRadius: 20, backgroundColor: "#FFFFFF" },
  cardTitle: { color: "#10201C", fontWeight: "800" },
  messageCard: { borderRadius: 18 },
  assistantCard: { backgroundColor: "#FFFFFF" },
  userCard: { alignSelf: "flex-end", width: "90%", backgroundColor: "#DDF3ED" },
  messageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  userLabel: { color: "#0D6257", fontWeight: "800" },
  assistantLabel: { color: "#A44A3F", fontWeight: "800" },
  messageText: { marginTop: 2, lineHeight: 24, fontSize: 16, color: "#182521" },
  muted: { marginTop: 8, color: "#42534D", lineHeight: 22, fontSize: 14 },
  thinkingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 4 },
  thinkingText: { color: "#42534D", fontWeight: "600" },
  voiceArea: { alignItems: "center", paddingVertical: 8 },
  voiceRing: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", backgroundColor: "#DDF3ED", borderWidth: 1, borderColor: "#B8DED5" },
  listeningRing: { transform: [{ scale: 1.06 }], backgroundColor: "#F8E4E0", borderColor: "#E5B8AF" },
  voiceLabel: { marginTop: 7, color: "#263934", fontWeight: "700", fontSize: 14 },
  composer: { gap: 10, paddingTop: 8, paddingBottom: 4 },
  input: { maxHeight: 120, backgroundColor: "#FFFFFF" },
  send: { borderRadius: 14 },
  sendContent: { paddingVertical: 4 },
  recordingHint: { textAlign: "center", color: "#53635E", fontSize: 12, paddingTop: 5 },
});

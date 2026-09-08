import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import * as Speech from "expo-speech";
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { Button, Card, IconButton, Text, TextInput } from "react-native-paper";
import { sendChatMessage, transcribeVoice } from "../services/api";
import { useAuthStore } from "../store/auth";

type Message = { role: "user" | "assistant"; content: string };

type TutorState = "idle" | "listening" | "processing" | "speaking";

export default function TutorScreen() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [state, setState] = useState<TutorState>("idle");
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  useEffect(() => {
    void (async () => {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (permission.granted) {
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      }
    })();
    return () => { Speech.stop(); };
  }, []);

  const canSend = useMemo(() => Boolean(input.trim() && accessToken && state !== "processing" && state !== "speaking"), [input, accessToken, state]);

  async function handleSend(text = input) {
    const message = text.trim();
    if (!message || !accessToken || state === "processing") return;
    const nextMessages = [...messages, { role: "user" as const, content: message }];
    setMessages(nextMessages);
    setInput("");
    setState("processing");
    try {
      const result = await sendChatMessage(message, accessToken, messages);
      setMessages([...nextMessages, { role: "assistant", content: result.message }]);
      speak(result.message);
    } catch (error) {
      setMessages([...nextMessages, { role: "assistant", content: error instanceof Error ? error.message : "Something went wrong. Please try again." }]);
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
      setState("processing");
      if (!uri || !accessToken) {
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
        <Text variant="headlineSmall" style={styles.title}>StudyBuddy Tutor</Text>
        <Text style={styles.subtitle}>Talk naturally, ask follow-ups, and learn step by step.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled">
        {messages.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="titleMedium">What are you studying today?</Text>
              <Text style={styles.muted}>Try: “Explain arrays”, “Give me an example”, or “Quiz me”.</Text>
            </Card.Content>
          </Card>
        ) : messages.map((message, index) => (
          <Card key={`${message.role}-${index}`} style={[styles.messageCard, message.role === "user" && styles.userCard]}>
            <Card.Content>
              <View style={styles.messageHeader}>
                <Text variant="labelMedium">{message.role === "user" ? "You" : "StudyBuddy"}</Text>
                {message.role === "assistant" && <IconButton icon="volume-high" size={19} onPress={() => speak(message.content)} accessibilityLabel="Read answer aloud" />}
              </View>
              <Text style={styles.messageText}>{message.content}</Text>
            </Card.Content>
          </Card>
        ))}
        {state === "processing" && <ActivityIndicator style={styles.loader} />}
      </ScrollView>

      <View style={styles.voiceArea}>
        <View style={styles.voiceCircle}>
          <IconButton
            icon={state === "listening" ? "stop" : state === "speaking" ? "volume-high" : "microphone"}
            mode="contained"
            size={36}
            onPress={state === "listening" ? stopRecording : state === "speaking" ? stopSpeaking : startRecording}
            disabled={state === "processing"}
            accessibilityLabel={state === "listening" ? "Stop listening" : state === "speaking" ? "Stop speaking" : "Tap to talk"}
          />
        </View>
        <Text style={styles.voiceLabel}>
          {state === "listening" ? "Listening…" : state === "processing" ? "Thinking…" : state === "speaking" ? "StudyBuddy is speaking…" : "Tap to talk"}
        </Text>
      </View>

      <View style={styles.composer}>
        <TextInput mode="outlined" value={input} onChangeText={setInput} placeholder="Or type your question…" multiline style={styles.input} disabled={!accessToken || state === "processing" || state === "speaking"} />
        <Button mode="contained" onPress={() => void handleSend()} disabled={!canSend} style={styles.send}>Send</Button>
      </View>
      {recorderState.isRecording ? <Text style={styles.recordingHint}>Recording in progress. Tap the stop button when you're finished.</Text> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { paddingTop: 18, paddingBottom: 12 },
  title: { fontWeight: "800" },
  subtitle: { opacity: 0.7, marginTop: 4, lineHeight: 21 },
  messages: { gap: 12, paddingBottom: 12, flexGrow: 1 },
  emptyCard: { marginTop: 20, borderRadius: 18 },
  messageCard: { borderRadius: 16 },
  userCard: { alignSelf: "flex-end", width: "90%" },
  messageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  messageText: { marginTop: 2, lineHeight: 22 },
  muted: { marginTop: 8, opacity: 0.7, lineHeight: 21 },
  loader: { marginVertical: 10 },
  voiceArea: { alignItems: "center", paddingVertical: 6 },
  voiceCircle: { borderRadius: 48 },
  voiceLabel: { marginTop: 2, fontWeight: "600", opacity: 0.7 },
  composer: { gap: 10, paddingTop: 8, paddingBottom: 4 },
  input: { maxHeight: 120 },
  send: { borderRadius: 12 },
  recordingHint: { textAlign: "center", opacity: 0.6, fontSize: 12, paddingTop: 4 },
});

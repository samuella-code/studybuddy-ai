import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Text } from "react-native-paper";

import { summarizeMaterial, uploadMaterial } from "../services/api";
import { useAuthStore } from "../store/auth";

export default function MaterialsScreen() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [loading, setLoading] = useState(false);
  const [filename, setFilename] = useState("");
  const [summary, setSummary] = useState("");

  async function pickMaterial() {
    if (!accessToken) return;
    setLoading(true);
    setSummary("");
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "text/plain", "text/markdown"], copyToCacheDirectory: true });
      if (result.canceled) return;
      const file = result.assets[0];
      const uploaded = await uploadMaterial({ uri: file.uri, name: file.name, type: file.mimeType ?? "application/pdf" }, accessToken);
      setFilename(uploaded.filename);
      const response = await summarizeMaterial(uploaded.id, accessToken);
      setSummary(response.summary);
    } catch (error) { Alert.alert("Material upload failed", error instanceof Error ? error.message : "Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}><View style={styles.content}>
      <Button icon="arrow-left" onPress={() => router.back()} compact>Back</Button>
      <Text variant="headlineMedium" style={styles.title}>Study materials 📄</Text>
      <Text style={styles.subtitle}>Upload your notes or a PDF and ask StudyBuddy to explain, summarize, or help you revise it.</Text>
      <Card style={styles.card}><Card.Content>
        <Text variant="titleMedium" style={styles.bold}>Bring your notes</Text>
        <Text style={styles.muted}>Supported: PDF, TXT, and Markdown · Maximum 10 MB</Text>
        <Button mode="contained" icon="upload" loading={loading} disabled={loading || !accessToken} onPress={() => void pickMaterial()} style={styles.button}>Upload study material</Button>
      </Card.Content></Card>
      {filename ? <Card style={styles.card}><Card.Content><Text variant="titleMedium">{filename}</Text><Text style={styles.muted}>StudyBuddy summary</Text><Text style={styles.summary}>{summary}</Text></Card.Content></Card> : null}
    </View></ScrollView>
  );
}

const styles = StyleSheet.create({ container: { padding: 20, paddingBottom: 48 }, content: { width: "100%", maxWidth: 820, alignSelf: "center", gap: 12 }, title: { fontWeight: "800", marginTop: 4 }, subtitle: { opacity: 0.68, lineHeight: 22, marginBottom: 8 }, card: { borderRadius: 20 }, bold: { fontWeight: "800" }, muted: { opacity: 0.68, marginTop: 5, lineHeight: 20 }, button: { borderRadius: 14, marginTop: 18 }, summary: { lineHeight: 23, marginTop: 10 }, });

import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Chip, Text, TextInput } from "react-native-paper";

import { createSubject, getSubjects } from "../services/api";
import { saveSubjects } from "../services/subjects-storage";
import { useAuthStore } from "../store/auth";

const SUBJECTS = ["Mathematics", "English", "Biology", "Chemistry", "Physics", "Computer Science", "Economics", "General Knowledge"];

export default function SubjectsScreen() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    void getSubjects(accessToken).then((items) => setSelected(items.map((item) => item.name))).catch(() => undefined);
  }, [accessToken]);

  function toggleSubject(subject: string) {
    setSelected((current) => current.includes(subject) ? current.filter((item) => item !== subject) : [...current, subject]);
  }

  function addCustom() {
    const value = custom.trim();
    if (value && !selected.some((item) => item.toLowerCase() === value.toLowerCase())) setSelected((items) => [...items, value]);
    setCustom("");
  }

  async function continueToHome() {
    if (!accessToken || selected.length === 0) return;
    setSaving(true);
    try {
      await Promise.all(selected.map((subject) => createSubject(subject, accessToken).catch(() => undefined)));
      await saveSubjects(selected);
      router.replace("/home");
    } finally { setSaving(false); }
  }

  async function skip() { await saveSubjects([]); router.replace("/home"); }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text variant="displaySmall" style={styles.title}>What are you studying?</Text>
        <Text style={styles.subtitle}>Pick the subjects you want StudyBuddy to help you with. You can change these later.</Text>
        <View style={styles.grid}>
          {SUBJECTS.map((subject) => <Chip key={subject} selected={selected.includes(subject)} onPress={() => toggleSubject(subject)} icon={selected.includes(subject) ? "check" : "book-open-variant"} style={styles.chip}>{subject}</Chip>)}
          {selected.filter((item) => !SUBJECTS.includes(item)).map((subject) => <Chip key={subject} selected onPress={() => toggleSubject(subject)} icon="check" style={styles.chip}>{subject}</Chip>)}
        </View>
        <View style={styles.customRow}>
          <TextInput mode="outlined" value={custom} onChangeText={setCustom} placeholder="Add another subject" style={styles.customInput} />
          <Button mode="outlined" onPress={addCustom} disabled={!custom.trim()}>Add</Button>
        </View>
        <Button mode="contained" disabled={selected.length === 0 || saving || !accessToken} loading={saving} onPress={continueToHome} style={styles.button} contentStyle={styles.buttonContent}>Continue</Button>
        <Button disabled={saving} onPress={skip}>Skip for now</Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: 24 },
  content: { width: "100%", maxWidth: 700, alignSelf: "center" },
  title: { fontWeight: "800", marginBottom: 10 },
  subtitle: { opacity: 0.7, lineHeight: 23, marginBottom: 28 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  chip: { marginBottom: 2 },
  customRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 22 },
  customInput: { flex: 1 },
  button: { borderRadius: 14, marginBottom: 8 },
  buttonContent: { paddingVertical: 6 },
});

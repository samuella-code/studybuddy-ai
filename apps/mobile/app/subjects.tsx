import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Chip, Text } from "react-native-paper";

const SUBJECTS = [
  "Mathematics",
  "English",
  "Biology",
  "Chemistry",
  "Physics",
  "Computer Science",
  "Economics",
  "Accounting",
  "Government",
  "Literature",
];

export default function SubjectsScreen() {
  const [selected, setSelected] = useState<string[]>([]);

  function toggleSubject(subject: string) {
    setSelected((current) =>
      current.includes(subject)
        ? current.filter((item) => item !== subject)
        : [...current, subject],
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text variant="displaySmall" style={styles.title}>What are you studying?</Text>
        <Text style={styles.subtitle}>
          Pick the subjects you want StudyBuddy to help you with. You can change these later.
        </Text>

        <View style={styles.grid}>
          {SUBJECTS.map((subject) => {
            const isSelected = selected.includes(subject);
            return (
              <Chip
                key={subject}
                selected={isSelected}
                onPress={() => toggleSubject(subject)}
                icon={isSelected ? "check" : "book-open-variant"}
                style={styles.chip}
              >
                {subject}
              </Chip>
            );
          })}
        </View>

        <Button
          mode="contained"
          disabled={selected.length === 0}
          onPress={() => router.replace("/home")}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Continue
        </Button>
        <Button onPress={() => router.replace("/home")}>Skip for now</Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: 24 },
  content: { width: "100%", maxWidth: 700, alignSelf: "center" },
  title: { fontWeight: "800", marginBottom: 10 },
  subtitle: { opacity: 0.7, lineHeight: 23, marginBottom: 28 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 30 },
  chip: { marginBottom: 2 },
  button: { borderRadius: 14, marginBottom: 8 },
  buttonContent: { paddingVertical: 6 },
});

import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>YOUR POCKET STUDY COACH</Text>
        <Text variant="displaySmall" style={styles.title}>StudyBuddy</Text>
        <Text variant="titleMedium" style={styles.subtitle}>
          Learn with clarity. Keep your momentum.
        </Text>
        <Text style={styles.body}>
          Ask questions, practice with quizzes, and build a study rhythm that works even when you are offline.
        </Text>
        <Button mode="contained" icon="arrow-right" onPress={() => router.push("/register")} style={styles.button} contentStyle={styles.buttonContent}>
          Get started
        </Button>
        <Button mode="text" onPress={() => router.push("/login")}>I already have an account</Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#F7F9F7" },
  content: { maxWidth: 560, width: "100%", alignSelf: "center" },
  eyebrow: { color: "#A44A3F", fontWeight: "800", letterSpacing: 1.2, marginBottom: 10 },
  title: { color: "#17211F", fontWeight: "800", marginBottom: 8 },
  subtitle: { color: "#136F63", marginBottom: 16, fontWeight: "700" },
  body: { color: "#44514D", lineHeight: 24, marginBottom: 28, maxWidth: 460 },
  button: { borderRadius: 12, marginBottom: 8 },
  buttonContent: { paddingVertical: 5 },
});

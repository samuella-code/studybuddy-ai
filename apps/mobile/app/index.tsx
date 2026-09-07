import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="displaySmall" style={styles.title}>StudyBuddy</Text>
        <Text variant="titleMedium" style={styles.subtitle}>
          Your AI-powered personal tutor.
        </Text>
        <Text style={styles.body}>
          Learn through conversation, practice with quizzes, build study plans, and track your progress.
        </Text>
        <Button mode="contained" onPress={() => router.push("/home")} style={styles.button}>
          Get started
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  content: { maxWidth: 560, width: "100%", alignSelf: "center" },
  title: { fontWeight: "800", marginBottom: 8 },
  subtitle: { marginBottom: 16 },
  body: { lineHeight: 24, marginBottom: 28, opacity: 0.72 },
  button: { borderRadius: 14, paddingVertical: 6 },
});

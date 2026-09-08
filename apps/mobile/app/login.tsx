import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";

import { login } from "../services/api";
import { useAuthStore } from "../store/auth";

const OFFLINE_USER = { id: "offline-demo", email: "demo@studybuddy.local", name: "Demo Learner" };

export default function LoginScreen() {
  const setSession = useAuthStore((state) => state.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    setLoading(true);
    try {
      const response = await login(email.trim(), password);
      setSession(response.user, response.access_token);
      router.replace("/home");
    } catch (err) {
      setError("The server is unavailable. You can continue in offline demo mode.");
    } finally {
      setLoading(false);
    }
  }

  function continueOffline() {
    setSession(OFFLINE_USER, "offline-demo");
    router.replace("/home");
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>STUDYBUDDY</Text>
        <Text variant="displaySmall" style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue learning with StudyBuddy.</Text>

        <TextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
        <TextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
        <HelperText type="error" visible={Boolean(error)}>{error}</HelperText>

        <Button mode="contained" loading={loading} disabled={loading || !email || !password} onPress={handleLogin} style={styles.button} contentStyle={styles.buttonContent}>
          Sign in
        </Button>
        <Button mode="outlined" icon="wifi-off" onPress={continueOffline} style={styles.offlineButton}>Continue offline</Button>
        <Text style={styles.offlineHint}>Offline mode keeps your practice space available without a server connection.</Text>
        <Button onPress={() => router.push("/register")}>Create an account</Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#F7F9F7" },
  content: { width: "100%", maxWidth: 520, alignSelf: "center" },
  eyebrow: { color: "#A44A3F", fontWeight: "800", letterSpacing: 1.2, marginBottom: 10 },
  title: { color: "#17211F", fontWeight: "800", marginBottom: 8 },
  subtitle: { color: "#44514D", marginBottom: 28, lineHeight: 22 },
  input: { marginBottom: 12, backgroundColor: "#FFFFFF" },
  button: { marginTop: 8, marginBottom: 8, borderRadius: 14, paddingVertical: 5 },
  buttonContent: { paddingVertical: 4 },
  offlineButton: { borderRadius: 12, marginBottom: 6 },
  offlineHint: { color: "#44514D", fontSize: 12, lineHeight: 18, marginBottom: 10 },
});

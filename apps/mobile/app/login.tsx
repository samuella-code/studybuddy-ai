import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";

import { login } from "../services/api";
import { useAuthStore } from "../store/auth";

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
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="displaySmall" style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue learning with StudyBuddy.</Text>

        <TextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
        <TextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
        <HelperText type="error" visible={Boolean(error)}>{error}</HelperText>

        <Button mode="contained" loading={loading} disabled={loading || !email || !password} onPress={handleLogin} style={styles.button}>
          Sign in
        </Button>
        <Button onPress={() => router.push("/register")}>Create an account</Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  content: { width: "100%", maxWidth: 520, alignSelf: "center" },
  title: { fontWeight: "800", marginBottom: 8 },
  subtitle: { opacity: 0.7, marginBottom: 28, lineHeight: 22 },
  input: { marginBottom: 12 },
  button: { marginTop: 8, marginBottom: 8, borderRadius: 14, paddingVertical: 5 },
});
